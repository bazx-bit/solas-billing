mod credit_lock;
mod db;
mod gateway;
mod jobs;
mod types;

use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rusqlite::Connection;
use serde_json::json;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tokio::sync::mpsc;

use crate::credit_lock::CreditLockManager;
use crate::db::*;
use crate::gateway::call_provider;
use crate::jobs::*;
use crate::types::*;

/// Shared application state across all handler threads
struct AppState {
    db: Arc<Mutex<Connection>>,
    http_client: reqwest::Client,
    credit_locks: CreditLockManager,
    job_tx: mpsc::UnboundedSender<BackgroundJob>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let db_path = std::env::var("DATABASE_URL").unwrap_or_else(|_| "../server/solas.db".into());
    let conn = Connection::open(&db_path).expect("Failed to open SQLite database");
    init_db(&conn);

    // Spawn background job processor
    let job_tx = spawn_job_processor(db_path.clone());
    spawn_cron_tasks(job_tx.clone());

    let state = Arc::new(AppState {
        db: Arc::new(Mutex::new(conn)),
        http_client: reqwest::Client::new(),
        credit_locks: CreditLockManager::new(),
        job_tx,
    });

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/v1/chat/completions", post(proxy_handler))
        .route("/webhooks/stripe", post(stripe_webhook_handler))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    println!("\n🦀 Solas Leaf Engine v1.0.0 on http://0.0.0.0:{}", port);
    println!("   ├─ Proxy:     POST /v1/chat/completions");
    println!("   ├─ Webhooks:  POST /webhooks/stripe");
    println!("   └─ Health:    GET  /health\n");

    axum::serve(listener, app).await.unwrap();
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "engine": "solas-leaf-rust",
        "version": "1.0.0",
        "features": [
            "per_user_credit_locking",
            "background_job_queue",
            "smart_response_cache",
            "multi_provider_failover",
            "rpm_tpm_rate_limiting",
            "streaming_penalty_guard",
            "log_rotation_archival",
            "analytics_sink_support"
        ]
    }))
}

/// Stripe webhook handler — dispatches to background queue instantly
async fn stripe_webhook_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    let event_type = payload["type"].as_str().unwrap_or("");

    if event_type == "checkout.session.completed" {
        let email = payload["data"]["object"]["customer_details"]["email"]
            .as_str()
            .unwrap_or("");
        let amount_cents = payload["data"]["object"]["amount_total"].as_f64().unwrap_or(0.0);
        let session_id = payload["data"]["object"]["id"].as_str().unwrap_or("unknown");

        // Look up user by email
        let conn = state.db.lock().unwrap();
        let user_id: Option<String> = conn
            .query_row(
                "SELECT id FROM users WHERE email = ?1",
                rusqlite::params![email],
                |row| row.get(0),
            )
            .ok();
        drop(conn);

        if let Some(uid) = user_id {
            // Fire-and-forget to background worker — returns HTTP 200 instantly
            state.job_tx.send(BackgroundJob::StripeWebhook {
                user_id: uid,
                amount: amount_cents / 100.0,
                stripe_session_id: session_id.to_string(),
            }).ok();

            return (StatusCode::OK, Json(json!({ "received": true })));
        }
    }

    (StatusCode::OK, Json(json!({ "received": true, "processed": false })))
}

/// Main proxy handler with per-user credit locking
async fn proxy_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<ChatCompletionRequest>,
) -> Response {
    let started = Instant::now();

    // ── 1. Auth ──────────────────────────────────────────
    let api_key = match headers.get("authorization") {
        Some(v) => v.to_str().unwrap_or("").replace("Bearer ", "").trim().to_string(),
        None => return error_response(StatusCode::UNAUTHORIZED, "Missing Bearer token", "unauthorized"),
    };

    let user = {
        let conn = state.db.lock().unwrap();
        match get_user_by_key(&conn, &api_key) {
            Some(u) => u,
            None => return error_response(StatusCode::UNAUTHORIZED, "Invalid API key", "invalid_api_key"),
        }
    };

    // ── 2. Acquire per-user credit lock (prevents overdraft) ──
    let user_lock = state.credit_locks.get_lock(&user.id).await;
    let _permit = match user_lock.acquire().await {
        Ok(p) => p,
        Err(_) => return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Lock acquisition failed", "internal"),
    };

    // Re-read credits under lock for consistency
    let user = {
        let conn = state.db.lock().unwrap();
        match get_user_by_key(&conn, &api_key) {
            Some(u) => u,
            None => return error_response(StatusCode::UNAUTHORIZED, "Invalid API key", "invalid_api_key"),
        }
    };

    // ── 3. Balance gate ──────────────────────────────────
    if user.credits <= 0.0 {
        return error_response(StatusCode::PAYMENT_REQUIRED, "Insufficient funds", "billing_hard_limit");
    }

    // ── 4. Rate limit (RPM + TPM) ────────────────────────
    let estimated_input = estimate_messages_tokens(&payload.messages);
    {
        let conn = state.db.lock().unwrap();
        let current_rpm = check_rpm(&conn, &user.id);
        if current_rpm >= user.rate_limit_rpm as i64 {
            return error_response(StatusCode::TOO_MANY_REQUESTS, "RPM rate limit exceeded", "rate_limit");
        }
        let current_tpm = check_tpm(&conn, &user.id);
        if (current_tpm + estimated_input) >= user.rate_limit_tpm as i64 {
            return error_response(StatusCode::TOO_MANY_REQUESTS, "TPM rate limit exceeded", "rate_limit");
        }
    }

    // ── 5. Pricing lookup ────────────────────────────────
    let mut model = payload.model.clone();
    let mut pricing = {
        let conn = state.db.lock().unwrap();
        get_model_pricing(&conn, &model).unwrap_or(ModelPricing {
            model_name: model.clone(),
            provider: "openai".into(),
            input_cost_per_million: 5.0,
            output_cost_per_million: 15.0,
        })
    };
    let mut provider = Provider::from_str(&pricing.provider);
    let mut recovery_model: Option<String> = None;

    // ── 6. Low-balance fallback ──────────────────────────
    let est_input_cost = (estimated_input as f64 / 1_000_000.0) * pricing.input_cost_per_million;
    if est_input_cost > user.credits && user.fallback_allowed {
        let conn = state.db.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT model_name, provider, input_cost_per_million, output_cost_per_million FROM model_pricing WHERE provider = ?1 AND input_cost_per_million < ?2 ORDER BY input_cost_per_million ASC LIMIT 1")
            .unwrap();

        if let Ok(cheaper) = stmt.query_row(
            rusqlite::params![pricing.provider, pricing.input_cost_per_million],
            |row| {
                Ok(ModelPricing {
                    model_name: row.get(0)?,
                    provider: row.get(1)?,
                    input_cost_per_million: row.get(2)?,
                    output_cost_per_million: row.get(3)?,
                })
            },
        ) {
            let fb_cost = (estimated_input as f64 / 1_000_000.0) * cheaper.input_cost_per_million;
            if fb_cost <= user.credits {
                recovery_model = Some(model.clone());
                model = cheaper.model_name.clone();
                pricing = cheaper;
            }
        }
    }

    let final_est_cost = (estimated_input as f64 / 1_000_000.0) * pricing.input_cost_per_million;
    if final_est_cost > user.credits {
        return error_response(StatusCode::PAYMENT_REQUIRED, "Insufficient credits", "billing_pre_limit");
    }

    let stream = payload.stream.unwrap_or(false);
    let request_id = uuid::Uuid::new_v4().to_string();

    // ── 7. Cache check (non-stream only) ─────────────────
    let cache_key = compute_cache_key(&model, &payload.messages);
    if !stream {
        let conn = state.db.lock().unwrap();
        if let Some((cached_payload, cached_in, cached_out)) = get_cached_response(&conn, &cache_key) {
            let in_cost = (cached_in as f64 / 1_000_000.0) * pricing.input_cost_per_million;
            let out_cost = (cached_out as f64 / 1_000_000.0) * pricing.output_cost_per_million;
            let total_cost = (in_cost + out_cost) * 0.10;
            let latency = started.elapsed().as_millis() as i64;

            deduct_and_log(&conn, &request_id, &user.id, &model, provider.as_str(), cached_in, cached_out, total_cost, 200, recovery_model.as_deref(), true, latency);
            drop(conn);

            return Response::builder()
                .status(200)
                .header("Content-Type", "application/json")
                .header("X-Solas-Cache", "HIT")
                .header("X-Solas-Latency-Ms", latency.to_string())
                .body(cached_payload.into())
                .unwrap();
        }
    }

    // ── 8. Provider call with failover ───────────────────
    let mut failover_from: Option<String> = None;

    let response = match call_provider(&state.http_client, &provider, &model, &payload.messages, stream, &payload).await {
        Ok(resp) if resp.status().is_server_error() || resp.status().as_u16() == 429 => {
            if let Some(route) = get_failover_route(&model) {
                failover_from = Some(model.clone());
                model = route.model.to_string();
                provider = route.provider;
                tracing::warn!("Failover: {} -> {}", failover_from.as_ref().unwrap(), model);
                call_provider(&state.http_client, &provider, &model, &payload.messages, stream, &payload).await
            } else {
                Ok(resp)
            }
        }
        other => other,
    };

    let resp = match response {
        Ok(r) => r,
        Err(e) => {
            tracing::error!("Gateway error: {}", e);
            return error_response(StatusCode::BAD_GATEWAY, "Provider unreachable", "gateway_error");
        }
    };

    let status_code = resp.status().as_u16();
    let body_text = resp.text().await.unwrap_or_default();
    let latency = started.elapsed().as_millis() as i64;

    // ── 9. Billing & Analytics ───────────────────────────
    let conn = state.db.lock().unwrap();

    if status_code == 200 {
        let output_tokens = if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&body_text) {
            parsed["usage"]["completion_tokens"].as_i64().unwrap_or_else(|| {
                let content = parsed["choices"][0]["message"]["content"].as_str().unwrap_or("");
                estimate_tokens(content)
            })
        } else {
            50
        };

        let in_cost = (estimated_input as f64 / 1_000_000.0) * pricing.input_cost_per_million;
        let out_cost = (output_tokens as f64 / 1_000_000.0) * pricing.output_cost_per_million;
        let total_cost = in_cost + out_cost;

        let fb = recovery_model.as_deref().or(failover_from.as_deref());
        deduct_and_log(&conn, &request_id, &user.id, &model, provider.as_str(), estimated_input, output_tokens, total_cost, 200, fb, false, latency);

        if !stream {
            set_cached_response(&conn, &cache_key, &model, &body_text, estimated_input, output_tokens);
        }

        // Dispatch analytics event to background worker (non-blocking)
        state.job_tx.send(BackgroundJob::AnalyticsFlush {
            batch: vec![AnalyticsEvent {
                request_id: request_id.clone(),
                user_id: user.id.clone(),
                model: model.clone(),
                provider: provider.as_str().to_string(),
                input_tokens: estimated_input,
                output_tokens,
                cost: total_cost,
                latency_ms: latency,
                cache_hit: false,
                timestamp: chrono::Utc::now().to_rfc3339(),
            }],
        }).ok();
    } else {
        deduct_and_log(&conn, &request_id, &user.id, &model, provider.as_str(), 0, 0, 0.0, status_code as i32, None, false, latency);
    }

    drop(conn);

    // ── 10. Return ───────────────────────────────────────
    let mut builder = Response::builder()
        .status(status_code)
        .header("Content-Type", "application/json")
        .header("X-Solas-Cache", "MISS")
        .header("X-Solas-Latency-Ms", latency.to_string());

    if failover_from.is_some() { builder = builder.header("X-Solas-Failover-Active", "true"); }
    if recovery_model.is_some() { builder = builder.header("X-Solas-Fallback-Triggered", "true"); }

    builder.body(body_text.into()).unwrap()
}

fn error_response(status: StatusCode, message: &str, error_type: &str) -> Response {
    (status, Json(json!({ "error": { "message": message, "type": error_type } }))).into_response()
}
