use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

/// Chat message in OpenAI-compatible format
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Incoming chat completion request
#[derive(Deserialize, Serialize, Debug)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub stream: Option<bool>,
    #[serde(default)]
    pub max_tokens: Option<i64>,
    #[serde(default)]
    pub temperature: Option<f64>,
}

/// OpenAI-compatible response
#[derive(Serialize, Deserialize, Debug)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub choices: Vec<CompletionChoice>,
    pub usage: UsageInfo,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CompletionChoice {
    pub index: i32,
    pub message: ChatMessage,
    pub finish_reason: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UsageInfo {
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub total_tokens: i64,
}

/// Solas error response envelope
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: ErrorDetail,
}

#[derive(Serialize)]
pub struct ErrorDetail {
    pub message: String,
    #[serde(rename = "type")]
    pub error_type: String,
}

/// LLM Provider identifiers
#[derive(Debug, Clone, PartialEq)]
pub enum Provider {
    OpenAI,
    Anthropic,
    Google,
}

impl Provider {
    pub fn from_str(s: &str) -> Self {
        match s {
            "anthropic" => Provider::Anthropic,
            "google" => Provider::Google,
            _ => Provider::OpenAI,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Provider::OpenAI => "openai",
            Provider::Anthropic => "anthropic",
            Provider::Google => "google",
        }
    }
}

/// Estimate token count from text (simple char/4 heuristic)
pub fn estimate_tokens(text: &str) -> i64 {
    ((text.len() as f64 / 4.0).ceil() as i64).max(1)
}

/// Estimate tokens for a full message array
pub fn estimate_messages_tokens(messages: &[ChatMessage]) -> i64 {
    let mut total: i64 = 0;
    for msg in messages {
        total += estimate_tokens(&msg.content) + 4; // +4 per-message overhead
    }
    total + 2 // +2 for start/end framing
}

/// Compute SHA-256 cache key from model + messages
pub fn compute_cache_key(model: &str, messages: &[ChatMessage]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(model.as_bytes());
    for msg in messages {
        hasher.update(msg.role.as_bytes());
        hasher.update(msg.content.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

/// Failover route mapping
pub struct FailoverRoute {
    pub model: &'static str,
    pub provider: Provider,
}

/// Get failover backup for a given model
pub fn get_failover_route(model: &str) -> Option<FailoverRoute> {
    match model {
        "gpt-4o" => Some(FailoverRoute { model: "claude-3-5-sonnet", provider: Provider::Anthropic }),
        "gpt-4o-mini" => Some(FailoverRoute { model: "claude-3-haiku", provider: Provider::Anthropic }),
        "claude-3-5-sonnet" => Some(FailoverRoute { model: "gemini-1.5-pro", provider: Provider::Google }),
        "gemini-1.5-flash" => Some(FailoverRoute { model: "gpt-4o-mini", provider: Provider::OpenAI }),
        _ => None,
    }
}
