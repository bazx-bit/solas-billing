# CLAUDE.md - Solas Billing Commands & Conventions

## Build & Run Commands
- Install workspaces: `npm install`
- Start server: `node apps/server/server.js` or `npm run dev:server`
- Start dashboard: `npm run dev:dashboard`
- Run integration tests: `node apps/sdk-test/integration.test.js`
- Run benchmarks: `node apps/testbench/benchmark.js`

## Code Style & Guidelines
- **Proxy Endpoints**: Must strictly align with OpenAI specs to maintain Zero-SDK drop-in proxy status.
- **Database (SQLite)**: Use WAL journaling for thread concurrency. Wrap multiple DB operations in a transaction block.
- **Node module standards**: Use ES Modules (`import`/`export`) rather than CommonJS (`require`).
