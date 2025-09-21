# Database Setup (Neon + Drizzle ORM)

This app uses Neon Postgres with Drizzle ORM (neon-http driver) for serverless-friendly per-request connections.

## Prerequisites

- Neon account with a database created
- Node.js 22+ and npm/pnpm
- Environment variables configured (see ENV_VARS.md)

## Setup Steps

### 1. Create Neon Database

1. Log into [Neon Console](https://console.neon.tech)
2. Create a new project/database
3. Copy the connection string from "Connection Details"
4. Ensure the URL includes `?sslmode=require` parameter

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set:
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://username:password@host:port/database?sslmode=require
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

Option A: Push schema directly (recommended for development)

```bash
npm run db:push
```

Option B: Generate and run migrations (for production)

```bash
npm run db:generate
npm run db:migrate
```

### 5. Verify Setup

```bash
npm run db:check
```

This should confirm database connectivity and show existing tables.

## Database Scripts

- `npm run db:generate` - Generate SQL migration files from schema
- `npm run db:push` - Push schema changes directly to database
- `npm run db:migrate` - Run pending SQL migrations
- `npm run db:check` - Verify database connection and schema

## Schema Files

- **Schema Definition**: `server/db/schema.ts`
- **Drizzle Config**: `drizzle.config.ts`
- **Migrations**: `drizzle/` directory
  - `0001_multitenancy.sql` - Initial multi-tenant tables
  - `0002_extended_ops.sql` - Phase 2 operational tables

## Connection Details

- **Driver**: `@neondatabase/serverless` (HTTP-based, no persistent connections)
- **Per-request**: New database connection for each API request
- **RLS**: Row Level Security enabled with tenant isolation
- **SSL**: Required for all connections (`sslmode=require`)

## Troubleshooting

- **Connection Issues**: Verify `sslmode=require` is in DATABASE_URL
- **Migration Errors**: Check that Neon database exists and is accessible
- **Schema Conflicts**: Use `npm run db:push` to sync development schema changes
