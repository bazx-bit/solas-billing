# Architectural Decisions: Database Selection

## ADR 1: Keep SQLite for local self-hosted developers
*   **Context**: Many startups want a self-hosted single-tenant proxy with zero external dependencies.
*   **Decision**: We will maintain SQLite as the default database for quick local runs, and support PostgreSQL as an opt-in variable (`DATABASE_URL`).
*   **Status**: Accepted.
