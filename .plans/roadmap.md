# Solas Billing Development Roadmap

## Milestone 1: Core Proxy & SQLite Ledger (Completed)
- [x] Fastify-based HTTP proxy intercepting `/v1/chat/completions`.
- [x] Embedded SQLite data tables for Users, logs, and transactions.
- [x] Built-in local token calculation using `js-tiktoken`.
- [x] Zero-SDK setup.

## Milestone 2: Advanced Fallbacks & Rate Limiting (Completed)
- [x] Automatic translation of payloads for Anthropic and Gemini.
- [x] Pre-request cost checks and auto-fallback routing to cheaper models.
- [x] Real-time request rate limiting (RPM) on SQLite.

## Milestone 3: Distributed Multi-Tenant & PostgreSQL (Q3 2026)
- [ ] Support PostgreSQL DSN for enterprise deployments.
- [ ] Add JWT authentication for developer teams admin seats.
- [ ] Write Kubernetes Helm Charts for self-hosting setups.
