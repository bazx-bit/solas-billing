use tokio::sync::mpsc;
use serde::{Deserialize, Serialize};

/// Background job types that run without blocking the proxy response thread.
/// Rust's tokio runtime handles these as lightweight green-threads (no Node.js event-loop blocking).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackgroundJob {
    /// Stripe webhook credit top-up processing
    StripeWebhook {
        user_id: String,
        amount: f64,
        stripe_session_id: String,
    },
    /// Rotate old request_logs entries to archive table
    LogRotation {
        older_than_days: i32,
    },
    /// Push analytics batch to external sink (ClickHouse/Tinybird)
    AnalyticsFlush {
        batch: Vec<AnalyticsEvent>,
    },
    /// Evict stale cache entries
    CacheEviction {
        max_age_hours: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub request_id: String,
    pub user_id: String,
    pub model: String,
    pub provider: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cost: f64,
    pub latency_ms: i64,
    pub cache_hit: bool,
    pub timestamp: String,
}

/// Spawn the background job processor.
/// Uses a multi-producer single-consumer channel so any handler thread
/// can enqueue jobs without blocking the HTTP response.
pub fn spawn_job_processor(db_path: String) -> mpsc::UnboundedSender<BackgroundJob> {
    let (tx, mut rx) = mpsc::unbounded_channel::<BackgroundJob>();

    tokio::spawn(async move {
        let conn = rusqlite::Connection::open(&db_path)
            .expect("Background worker failed to open database");
        conn.pragma_update(None, "journal_mode", &"WAL").ok();

        // Create archive table for log rotation
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS request_logs_archive (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                model TEXT NOT NULL,
                provider TEXT NOT NULL,
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                status INTEGER NOT NULL,
                fallback_triggered TEXT,
                cache_hit INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                timestamp DATETIME
            )"
        ).ok();

        tracing::info!("[BackgroundWorker] Job processor started, listening for tasks...");

        while let Some(job) = rx.recv().await {
            match job {
                BackgroundJob::StripeWebhook { user_id, amount, stripe_session_id } => {
                    tracing::info!("[BackgroundWorker] Processing Stripe webhook: session={}, amount=${:.2}", stripe_session_id, amount);
                    
                    let tx = conn.unchecked_transaction().expect("tx");
                    tx.execute(
                        "UPDATE users SET credits = credits + ?1 WHERE id = ?2",
                        rusqlite::params![amount, user_id],
                    ).ok();
                    tx.execute(
                        "INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?1, ?2, ?3, 'credit', ?4)",
                        rusqlite::params![uuid::Uuid::new_v4().to_string(), user_id, amount, format!("Stripe: {}", stripe_session_id)],
                    ).ok();
                    tx.commit().ok();
                    
                    tracing::info!("[BackgroundWorker] Stripe credit applied: +${:.2} to user {}", amount, user_id);
                }

                BackgroundJob::LogRotation { older_than_days } => {
                    tracing::info!("[BackgroundWorker] Rotating logs older than {} days...", older_than_days);
                    
                    let moved = conn.execute(
                        &format!(
                            "INSERT INTO request_logs_archive SELECT * FROM request_logs WHERE timestamp < datetime('now', '-{} days')",
                            older_than_days
                        ),
                        [],
                    ).unwrap_or(0);

                    conn.execute(
                        &format!(
                            "DELETE FROM request_logs WHERE timestamp < datetime('now', '-{} days')",
                            older_than_days
                        ),
                        [],
                    ).ok();

                    tracing::info!("[BackgroundWorker] Rotated {} log entries to archive", moved);
                }

                BackgroundJob::AnalyticsFlush { batch } => {
                    tracing::info!("[BackgroundWorker] Flushing {} analytics events to external sink...", batch.len());
                    
                    // In production, this would POST to Tinybird/ClickHouse HTTP endpoint
                    let tinybird_url = std::env::var("TINYBIRD_INGEST_URL").ok();
                    let tinybird_token = std::env::var("TINYBIRD_TOKEN").ok();

                    if let (Some(url), Some(token)) = (tinybird_url, tinybird_token) {
                        let client = reqwest::Client::new();
                        let ndjson: String = batch
                            .iter()
                            .filter_map(|e| serde_json::to_string(e).ok())
                            .collect::<Vec<_>>()
                            .join("\n");

                        match client
                            .post(&url)
                            .header("Authorization", format!("Bearer {}", token))
                            .header("Content-Type", "application/x-ndjson")
                            .body(ndjson)
                            .send()
                            .await
                        {
                            Ok(resp) => tracing::info!("[BackgroundWorker] Tinybird flush: HTTP {}", resp.status()),
                            Err(e) => tracing::error!("[BackgroundWorker] Tinybird flush failed: {}", e),
                        }
                    } else {
                        tracing::debug!("[BackgroundWorker] No TINYBIRD_INGEST_URL configured, skipping external flush");
                    }
                }

                BackgroundJob::CacheEviction { max_age_hours } => {
                    let deleted = conn.execute(
                        &format!(
                            "DELETE FROM response_cache WHERE created_at < datetime('now', '-{} hours')",
                            max_age_hours
                        ),
                        [],
                    ).unwrap_or(0);

                    tracing::info!("[BackgroundWorker] Evicted {} stale cache entries (>{} hours old)", deleted, max_age_hours);
                }
            }
        }
    });

    tx
}

/// Spawn periodic maintenance tasks (log rotation, cache eviction)
pub fn spawn_cron_tasks(job_tx: mpsc::UnboundedSender<BackgroundJob>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Every hour
        loop {
            interval.tick().await;

            // Rotate logs older than 30 days
            job_tx.send(BackgroundJob::LogRotation { older_than_days: 30 }).ok();

            // Evict cache entries older than 24 hours
            job_tx.send(BackgroundJob::CacheEviction { max_age_hours: 24 }).ok();

            tracing::info!("[Cron] Scheduled maintenance tasks dispatched");
        }
    });
}
