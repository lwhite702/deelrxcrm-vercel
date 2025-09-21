# Database Setup (Neon + Drizzle)

This project uses Neon Postgres with Drizzle. Runtime uses pooled connections; migrations should use the direct (unpooled) Neon URL.

## Connection env vars
- `DATABASE_URL`: pooled (pgbouncer). Used by the app at runtime.
- `DATABASE_URL_UNPOOLED`: direct (no pool). Preferred for migrations.
- Drizzle (root) prioritizes: `DATABASE_URL_UNPOOLED || POSTGRES_URL || DATABASE_URL`.

## Root schema migration (safe SQL)
Applies `drizzle/0001_multitenancy.sql` without dropping unrelated tables.

```bash
DATABASE_URL="$postgres_POSTGRES_URL_NON_POOLING" npm run db:migrate:root-sql
```

## SaaS Starter migrations
Run with the direct URL to avoid pgbouncer limitations:

```bash
POSTGRES_URL="$postgres_POSTGRES_URL_NON_POOLING" \
DATABASE_URL="$postgres_POSTGRES_URL_NON_POOLING" \
pnpm -C saas-starter db:migrate
```

## DB check script
Verifies presence of key tables and prints counts/types.

```bash
DATABASE_URL="$postgres_POSTGRES_URL_NON_POOLING" npm run db:check
```

## Tenant bootstrap
Creates a personal tenant and owner membership for a user.
Detects integer vs text `user_id` columns and adapts.

```bash
DATABASE_URL="$postgres_POSTGRES_URL_NON_POOLING" USER_ID=1 npm run db:bootstrap-tenant
```

## Vercel environment variables
Use Vercel CLI to set DB URLs in Production and Preview.

```bash
# Production
printf "%s\n" "$postgres_POSTGRES_URL" | vercel env add DATABASE_URL production
printf "%s\n" "$postgres_POSTGRES_URL_NON_POOLING" | vercel env add DATABASE_URL_UNPOOLED production

# Preview
printf "%s\n" "$postgres_POSTGRES_URL" | vercel env add DATABASE_URL preview
printf "%s\n" "$postgres_POSTGRES_URL_NON_POOLING" | vercel env add DATABASE_URL_UNPOOLED preview
```

If a variable already exists, remove it first:

```bash
vercel env remove DATABASE_URL production
vercel env remove DATABASE_URL_UNPOOLED production
```
