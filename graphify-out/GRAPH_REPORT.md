# Graph Report - solas-billing  (2026-06-29)

## Corpus Check
- 47 files · ~10,537 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 238 nodes · 205 edges · 39 communities (28 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `062cba5d`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
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

## God Nodes (most connected - your core abstractions)
1. `workspaces` - 10 edges
2. `scripts` - 5 edges
3. `scripts` - 5 edges
4. `Solas Billing` - 5 edges
5. `vcs` - 4 edges
6. `Proposal: Multi-Tenant Database Scale Migration (SQLite to PostgreSQL)` - 4 edges
7. `SolasClient` - 4 edges
8. `Solas Billing Development Roadmap` - 4 edges
9. `formatter` - 3 edges
10. `linter` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (39 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (16): dependencies, better-sqlite3, dotenv, fastify, @fastify/cors, js-tiktoken, description, devDependencies (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): dependencies, lucide-react, react, react-dom, devDependencies, oxlint, @types/react, @types/react-dom (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (10): description, name, private, scripts, dev, dev:dashboard, dev:server, install:all (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.28
Nodes (6): db, dbPath, __dirname, __filename, initDB(), app

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

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (4): Milestone 1: Core Proxy & SQLite Ledger (Completed), Milestone 2: Advanced Fallbacks & Rate Limiting (Completed), Milestone 3: Distributed Multi-Tenant & PostgreSQL (Q3 2026), Solas Billing Development Roadmap

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): dashboard, __dirname, __filename, rootDir, server

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

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

## Knowledge Gaps
- **135 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 37` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 38` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._