use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

struct AppState {
    db: Arc<Mutex<Connection>>,
    http_client: reqwest::Client,
}

#[derive(Deserialize, Serialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: Option<bool>,
}

#[derive(Serialize)]
struct ErrorDetail {
    message: String,
    #[serde(rename = "type")]
    error_type: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    // Connect to SQLite database
    let db_path = std::env::var("DATABASE_URL").unwrap_or_else(|_| "../server/solas.db".to_string());
    let conn = Connection::open(&db_path).expect("Failed to connect to SQLite database");
    
    // Set journal mode to WAL for concurrent performance
    conn.pragma_update(None, "journal_mode", &"WAL").ok();

    let shared_state = Arc::new(AppState {
        db: Arc::new(Mutex::new(conn)),
        http_client: reqwest::Client::new(),
    });

    // Define router
    let app = Router::new()
        .route("/v1/chat/completions", post(handle_chat_completions))
        .with_state(shared_state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();
        
    println!("\n🚀 Solas Rust Leaf Engine proxy running on port {}\n", port);
    axum::serve(listener, app).await.unwrap();
}

async fn handle_chat_completions(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<ChatCompletionRequest>,
) -> Response {
    // 1. Extract and validate authorization token
    let auth_header = match headers.get("authorization") {
        Some(h) => h.to_str().unwrap_or(""),
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        message: "Missing Authorization Header".to_string(),
                        error_type: "unauthorized".to_string(),
                    },
                }),
            )
                .into_response();
        }
    };

    let api_key = auth_header.replace("Bearer ", "").trim().to_string();
    let db = state.db.lock().unwrap();

    // 2. Fetch User wallet metadata
    let mut stmt = match db.prepare("SELECT id, email, credits, rate_limit_rpm FROM users WHERE api_key = ?1") {
        Ok(s) => s,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        message: "Database connection failure".to_string(),
                        error_type: "db_error".to_string(),
                    },
                }),
            )
                .into_response();
        }
    };

    let user_row = stmt.query_row(params![api_key], |row| {
        Ok((
            row.get::<_, String>(0)?, // id
            row.get::<_, String>(1)?, // email
            row.get::<_, f64>(2)?,    // credits
            row.get::<_, i32>(3)?,    // rpm
        ))
    });

    let (user_id, email, credits, rpm) = match user_row {
        Ok(data) => data,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        message: "Invalid API key".to_string(),
                        error_type: "invalid_api_key".to_string(),
                    },
                }),
            )
                .into_response();
        }
    };

    // 3. Balance gating checks
    if credits <= 0.0 {
        return (
            StatusCode::PAYMENT_REQUIRED,
            Json(ErrorResponse {
                error: ErrorDetail {
                    message: "Insufficient funds".to_string(),
                    error_type: "insufficient_credits".to_string(),
                },
            }),
        )
            .into_response();
    }

    // 4. Rate limiting check (RPM)
    let requests_last_min: i64 = db
        .query_row(
            "SELECT count(*) FROM request_logs WHERE user_id = ?1 AND timestamp > datetime('now', '-1 minute')",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if requests_last_min >= rpm as i64 {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(ErrorResponse {
                error: ErrorDetail {
                    message: format!("Rate limit exceeded. Maximum {} requests per minute.", rpm),
                    error_type: "rate_limit_exceeded".to_string(),
                },
            }),
        )
            .into_response();
    }

    // 5. Cost estimation (prompt chars / 4 as local estimate)
    let total_prompt_chars: usize = payload.messages.iter().map(|m| m.content.len()).sum();
    let estimated_tokens = (total_prompt_chars / 4) + 12;
    let cost_per_million = 5.0; // Default gpt-4o pricing
    let estimated_cost = (estimated_tokens as f64 / 1_000_000.0) * cost_per_million;

    if estimated_cost > credits {
        return (
            StatusCode::PAYMENT_REQUIRED,
            Json(ErrorResponse {
                error: ErrorDetail {
                    message: format!(
                        "Insufficient credits for prompt query cost: estimated cost is ${:.6}",
                        estimated_cost
                    ),
                    error_type: "insufficient_credits".to_string(),
                },
            }),
        )
            .into_response();
    }

    // 6. Forwarding request to OpenAI backend (demonstration proxy forwarder)
    let openapi_key = std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "dummy_key".to_string());
    
    let target_url = "https://api.openai.com/v1/chat/completions";
    let res = state.http_client
        .post(target_url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", openapi_key))
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(response) => {
            let status = response.status();
            let body_text = response.text().await.unwrap_or_default();

            // 7. Balance deduction on successful completion
            if status.is_success() {
                let output_tokens = 50; // Mock output token length
                let final_cost = ((estimated_tokens + output_tokens) as f64 / 1_000_000.0) * cost_per_million;
                
                // Deduct credits in SQLite
                db.execute(
                    "UPDATE users SET credits = credits - ?1 WHERE id = ?2",
                    params![final_cost, user_id],
                ).ok();

                // Log request transaction
                let request_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![request_id, user_id, payload.model, "openai", estimated_tokens, output_tokens, final_cost, 200],
                ).ok();

                println!("[Rust Engine] Request logged successfully. Billed ${:.6} to {}", final_cost, email);
            }

            // Return response
            Response::builder()
                .status(status.as_u16())
                .header("Content-Type", "application/json")
                .body(body_text.into())
                .unwrap()
        }
        Err(_) => {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        message: "Failed to communicate with OpenAI backend".to_string(),
                        error_type: "gateway_error".to_string(),
                    },
                }),
            )
                .into_response()
        }
    }
}
