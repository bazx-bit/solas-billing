use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Semaphore;

/// Per-user credit lock using tokio Semaphore.
///
/// Problem with SQLite alone: If 10 requests arrive simultaneously for the same user,
/// all 10 threads read credits = $5.00, all 10 authorize, and all 10 deduct independently.
/// The user ends up with negative balance (overdraft).
///
/// Solution: Before reading credits, each request acquires a per-user semaphore permit.
/// Only ONE request per user can read-check-deduct at a time. Other requests wait in queue.
/// This is the Rust equivalent of Redis SETNX distributed locking, but in-process.
pub struct CreditLockManager {
    locks: tokio::sync::Mutex<HashMap<String, Arc<Semaphore>>>,
}

impl CreditLockManager {
    pub fn new() -> Self {
        Self {
            locks: tokio::sync::Mutex::new(HashMap::new()),
        }
    }

    /// Get or create a per-user semaphore (1 permit = exclusive access)
    pub async fn get_lock(&self, user_id: &str) -> Arc<Semaphore> {
        let mut map = self.locks.lock().await;
        map.entry(user_id.to_string())
            .or_insert_with(|| Arc::new(Semaphore::new(1)))
            .clone()
    }
}
