# Database Setup (Neon + Drizzle ORM)

This app uses Neon Postgres with Drizzle ORM (neon-http driver) and per-request connections.

Prerequisites
- Neon account and a database (Project → Create DB)
- Node 22+, pnpm/npm, `drizzle-kit`

1) Create Neon database
- Create a new database in Neon.
- Copy the pooled or unpooled connection string. Ensure it includes `sslmode=require`.
- Set `DATABASE_URL` in `.env`. Optionally set `DATABASE_URL_UNPOOLED` for Drizzle generation.

2) Install deps
```bash
npm install
```

3) Generate SQL from schema (optional)
```bash
npm run db:generate
```

4) Apply migrations
- Push to the database (gentle, idempotent):
```bash
npm run db:push
```
- Or run compiled migrations (if using SQL files):
```bash
npm run db:migrate
```

5) Verify connection
```bash
npm run db:check
```

Notes
- Schema source: `server/db/schema.ts`
- Drizzle config: `drizzle.config.ts`
- Existing initial migration: `drizzle/0001_multitenancy.sql`
