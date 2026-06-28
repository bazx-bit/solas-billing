# Proposal: Multi-Tenant Database Scale Migration (SQLite to PostgreSQL)

## Background
Solas Billing currently uses a local-first SQLite database in WAL mode. To scale to a SaaS/multi-tenant platform where multiple developer teams host their billing plans and client keys, we propose migrating to PostgreSQL.

## Target Schema Architecture

```sql
-- Team accounts
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users under the organizations
CREATE TABLE org_users (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL
);
```

## Migration Plan
1. **Abstraction**: Move all raw SQL queries in `apps/server/db.js` behind a Repository Pattern.
2. **Postgres Adapter**: Implement a Postgres client connector using Prisma ORM.
3. **Data Sync**: Write a script to export SQLite records to JSON and seed them into PostgreSQL.
