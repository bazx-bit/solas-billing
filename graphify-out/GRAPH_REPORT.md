# Graph Report - solas-billing  (2026-06-29)

## Corpus Check
- 51 files · ~13,180 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 318 nodes · 370 edges · 40 communities (30 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6db07eff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `proxy_handler()` - 21 edges
2. `CreditLockManager` - 10 edges
3. `AppState` - 10 edges
4. `workspaces` - 10 edges
5. `call_provider()` - 9 edges
6. `stripe_webhook_handler()` - 7 edges
7. `ChatMessage` - 7 edges
8. `ChatCompletionRequest` - 7 edges
9. `scripts` - 6 edges
10. `tasks` - 6 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `init_db()`  [INFERRED]
  apps/leaf/src/main.rs → apps/leaf/src/db.rs
- `proxy_handler()` --calls--> `get_user_by_key()`  [INFERRED]
  apps/leaf/src/main.rs → apps/leaf/src/db.rs
- `proxy_handler()` --calls--> `get_model_pricing()`  [INFERRED]
  apps/leaf/src/main.rs → apps/leaf/src/db.rs
- `proxy_handler()` --calls--> `check_rpm()`  [INFERRED]
  apps/leaf/src/main.rs → apps/leaf/src/db.rs
- `proxy_handler()` --calls--> `check_tpm()`  [INFERRED]
  apps/leaf/src/main.rs → apps/leaf/src/db.rs

## Import Cycles
- None detected.

## Communities (40 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (16): dependencies, better-sqlite3, dotenv, fastify, @fastify/cors, js-tiktoken, description, devDependencies (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): dependencies, lucide-react, react, react-dom, devDependencies, oxlint, @types/react, @types/react-dom (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, build:leaf, dev, dev:dashboard, dev:server (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (7): db, dbPath, __dirname, __filename, initDB(), app, FAILOVER_ROUTES

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (7): 1. Start the Proxy Server, 2. Start the Admin Dashboard, 📂 Codebase Structure, 🛠️ Getting Started, 🚀 How to use (Client Example), ⚡ Key Features, Solas Billing

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (7): dependencies, stripe, description, main, name, type, version

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (6): dependencies, description, main, name, type, version

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (6): dependencies, description, main, name, type, version

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (4): Milestone 1: Core Proxy & SQLite Ledger (Completed), Milestone 2: Advanced Fallbacks & Rate Limiting (Completed), Milestone 3: Distributed Multi-Tenant & PostgreSQL (Q3 2026), Solas Billing Development Roadmap

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): dashboard, __dirname, __filename, rootDir, server

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): Development, Features, Solas Billing Dashboard

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (5): description, main, name, type, version

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): description, main, name, type, version

### Community 21 - "Community 21"
Cohesion: 0.50
Nodes (3): dbPath, __dirname, __filename

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (4): Background, Migration Plan, Proposal: Multi-Tenant Database Scale Migration (SQLite to PostgreSQL), Target Schema Architecture

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): Agent Billing Skill, Description, Tools

### Community 33 - "Community 33"
Cohesion: 0.50
Nodes (3): Build & Run Commands, CLAUDE.md - Solas Billing Commands & Conventions, Code Style & Guidelines

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (29): entry, project, entry, project, project, entry, project, entry (+21 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): files, ignoreUnknown, formatter, enabled, indentStyle, quoteStyle, javascript, formatter (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (33): Connection, Error, HeaderMap, Option, Response, Result, check_rpm(), check_tpm() (+25 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (20): dependsOn, cache, dependsOn, outputs, outputs, cache, dependsOn, persistent (+12 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (22): Arc, Client, HashMap, IntoResponse, Json, Mutex, Self, Semaphore (+14 more)

## Knowledge Gaps
- **147 isolated node(s):** `Development`, `Features`, `name`, `private`, `version` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `proxy_handler()` connect `Community 39` to `Community 41`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `AppState` connect `Community 41` to `Community 39`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `proxy_handler()` (e.g. with `check_rpm()` and `check_tpm()`) actually correct?**
  _`proxy_handler()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Development`, `Features`, `name` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 37` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._