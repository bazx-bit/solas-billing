use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};

/// Database schema initializer for Solas Leaf Engine.
/// Shares the same SQLite database as the Node.js server for seamless interop.
pub fn init_db(conn: &Connection) {
    conn.pragma_update(None, "journal_mode", &"WAL").ok();
    conn.pragma_update(None, "synchronous", &"NORMAL").ok();
    conn.pragma_update(None, "cache_size", &"-64000").ok(); // 64MB page cache
    conn.pragma_update(None, "temp_store", &"MEMORY").ok();

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            api_key TEXT UNIQUE NOT NULL,
            credits REAL DEFAULT 10.0,
            rate_limit_rpm INTEGER DEFAULT 60,
            rate_limit_tpm INTEGER DEFAULT 50000,
            fallback_allowed INTEGER DEFAULT 1,
            stripe_customer_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS model_pricing (
            model_name TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            input_cost_per_million REAL NOT NULL,
            output_cost_per_million REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS request_logs (
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
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS response_cache (
            key_hash TEXT PRIMARY KEY,
            model TEXT NOT NULL,
            response_payload TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )
    .expect("Failed to initialize database schema");
}

/// User wallet record returned from SQLite
#[derive(Debug, Clone)]
pub struct UserRecord {
    pub id: String,
    pub email: String,
    pub credits: f64,
    pub rate_limit_rpm: i32,
    pub rate_limit_tpm: i32,
    pub fallback_allowed: bool,
}

/// Model pricing record
#[derive(Debug, Clone)]
pub struct ModelPricing {
    pub model_name: String,
    pub provider: String,
    pub input_cost_per_million: f64,
    pub output_cost_per_million: f64,
}

/// Look up a user by API key
pub fn get_user_by_key(conn: &Connection, api_key: &str) -> Option<UserRecord> {
    let mut stmt = conn
        .prepare("SELECT id, email, credits, rate_limit_rpm, rate_limit_tpm, fallback_allowed FROM users WHERE api_key = ?1")
        .ok()?;

    stmt.query_row(params![api_key], |row| {
        Ok(UserRecord {
            id: row.get(0)?,
            email: row.get(1)?,
            credits: row.get(2)?,
            rate_limit_rpm: row.get(3)?,
            rate_limit_tpm: row.get(4)?,
            fallback_allowed: row.get::<_, i32>(5)? == 1,
        })
    })
    .ok()
}

/// Get model pricing by model name
pub fn get_model_pricing(conn: &Connection, model_name: &str) -> Option<ModelPricing> {
    let mut stmt = conn
        .prepare("SELECT model_name, provider, input_cost_per_million, output_cost_per_million FROM model_pricing WHERE model_name = ?1")
        .ok()?;

    stmt.query_row(params![model_name], |row| {
        Ok(ModelPricing {
            model_name: row.get(0)?,
            provider: row.get(1)?,
            input_cost_per_million: row.get(2)?,
            output_cost_per_million: row.get(3)?,
        })
    })
    .ok()
}

/// Check RPM rate limit (returns current count)
pub fn check_rpm(conn: &Connection, user_id: &str) -> i64 {
    conn.query_row(
        "SELECT count(*) FROM request_logs WHERE user_id = ?1 AND timestamp > datetime('now', '-1 minute')",
        params![user_id],
        |row| row.get(0),
    )
    .unwrap_or(0)
}

/// Check TPM rate limit (returns total tokens in last minute)
pub fn check_tpm(conn: &Connection, user_id: &str) -> i64 {
    conn.query_row(
        "SELECT COALESCE(sum(input_tokens + output_tokens), 0) FROM request_logs WHERE user_id = ?1 AND timestamp > datetime('now', '-1 minute')",
        params![user_id],
        |row| row.get(0),
    )
    .unwrap_or(0)
}

/// Atomically deduct credits and insert a request log entry
pub fn deduct_and_log(
    conn: &Connection,
    request_id: &str,
    user_id: &str,
    model: &str,
    provider: &str,
    input_tokens: i64,
    output_tokens: i64,
    cost: f64,
    status: i32,
    fallback: Option<&str>,
    cache_hit: bool,
    latency_ms: i64,
) {
    let tx = conn.unchecked_transaction().expect("Failed to begin tx");

    tx.execute(
        "UPDATE users SET credits = credits - ?1 WHERE id = ?2",
        params![cost, user_id],
    )
    .ok();

    tx.execute(
        "INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered, cache_hit, latency_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            request_id,
            user_id,
            model,
            provider,
            input_tokens,
            output_tokens,
            cost,
            status,
            fallback,
            cache_hit as i32,
            latency_ms
        ],
    )
    .ok();

    tx.commit().ok();
}

/// Look up cached response
pub fn get_cached_response(conn: &Connection, key_hash: &str) -> Option<(String, i64, i64)> {
    let mut stmt = conn
        .prepare("SELECT response_payload, input_tokens, output_tokens FROM response_cache WHERE key_hash = ?1")
        .ok()?;

    stmt.query_row(params![key_hash], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    })
    .ok()
}

/// Store response in cache
pub fn set_cached_response(
    conn: &Connection,
    key_hash: &str,
    model: &str,
    payload: &str,
    input_tokens: i64,
    output_tokens: i64,
) {
    conn.execute(
        "INSERT OR REPLACE INTO response_cache (key_hash, model, response_payload, input_tokens, output_tokens)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![key_hash, model, payload, input_tokens, output_tokens],
    )
    .ok();
}
