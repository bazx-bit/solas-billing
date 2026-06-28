use reqwest::Client;
use serde_json::json;

use crate::types::{ChatCompletionRequest, ChatMessage, Provider};

/// Execute a provider call, translating payloads as needed.
/// Returns raw reqwest::Response for the caller to process.
pub async fn call_provider(
    client: &Client,
    provider: &Provider,
    model: &str,
    messages: &[ChatMessage],
    stream: bool,
    original_body: &ChatCompletionRequest,
) -> Result<reqwest::Response, reqwest::Error> {
    match provider {
        Provider::OpenAI => {
            let api_key = std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "dummy".into());
            client
                .post("https://api.openai.com/v1/chat/completions")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&json!({
                    "model": model,
                    "messages": messages,
                    "stream": stream,
                    "max_tokens": original_body.max_tokens,
                    "temperature": original_body.temperature,
                }))
                .send()
                .await
        }
        Provider::Anthropic => {
            let api_key = std::env::var("ANTHROPIC_API_KEY").unwrap_or_else(|_| "dummy".into());

            // Extract system message and filter it from messages array
            let system_text: Option<String> = messages
                .iter()
                .find(|m| m.role == "system")
                .map(|m| m.content.clone());

            let filtered: Vec<&ChatMessage> = messages.iter().filter(|m| m.role != "system").collect();

            let mut body = json!({
                "model": model,
                "max_tokens": original_body.max_tokens.unwrap_or(1024),
                "messages": filtered,
                "stream": stream,
            });

            if let Some(sys) = system_text {
                body["system"] = json!(sys);
            }

            client
                .post("https://api.anthropic.com/v1/messages")
                .header("content-type", "application/json")
                .header("x-api-key", api_key)
                .header("anthropic-version", "2023-06-01")
                .json(&body)
                .send()
                .await
        }
        Provider::Google => {
            let api_key = std::env::var("GEMINI_API_KEY").unwrap_or_else(|_| "dummy".into());

            let contents: Vec<serde_json::Value> = messages
                .iter()
                .map(|m| {
                    json!({
                        "role": if m.role == "assistant" { "model" } else { "user" },
                        "parts": [{ "text": m.content }]
                    })
                })
                .collect();

            client
                .post(format!(
                    "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                    model, api_key
                ))
                .header("Content-Type", "application/json")
                .json(&json!({ "contents": contents }))
                .send()
                .await
        }
    }
}
