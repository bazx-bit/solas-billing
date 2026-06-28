# Solas Billing Architecture Documentation

## Request Intercept Lifecycle

```mermaid
graph TD
    Client[Client App] -->|POST /v1/chat/completions| Proxy[Solas Proxy Server]
    Proxy -->|1. Authenticate Key| DB[(SQLite Database)]
    DB -->|Valid Key| CheckLimit[2. Check Credits & RPM]
    CheckLimit -->|Balance Low & Fallback Enabled| Fallback[3. Downgrade to Cheaper Model]
    CheckLimit -->|Balance OK| Forward[4. Forward to LLM Provider]
    Fallback --> Forward
    Forward -->|Call| OpenAI[OpenAI / Anthropic / Gemini]
    OpenAI -->|Response| Proxy
    Proxy -->|5. Compute Exact Cost| DB
    Proxy -->|6. Return OpenAI Standard Payload| Client
```

1. **Authentication**: The proxy extracts bearer auth and retrieves user's database entry.
2. **Checks**: Verified against Rate Limits and outstanding balance.
3. **Fallback recovery**: Automatically resolves cheaper sibling models when high-tier prompt costs exceed credits.
4. **Proxy Forward**: Requests are sent to OpenAI/Anthropic/Gemini.
5. **Billing**: Database balance decremented, logs written.
