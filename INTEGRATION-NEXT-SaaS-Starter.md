# Integration Plan: DeelRx CRM ↔ Next.js SaaS Starter

This document outlines a pragmatic path to integrate our current app (Vite + Express API + Next App Router pages) with the Next.js SaaS Starter (Next 15 + Tailwind v4, Drizzle + Postgres, Stripe, middleware auth, PPR, Turbopack).

## Goals
- Reuse our working features while adopting the starter’s auth, billing, and layout primitives.
- Keep serverless/Vercel compatibility, Neon + Drizzle, and Blob uploads.

## High-level Steps
1. Align package baselines
   - Pin Next to the starter version within `saas-starter` only; keep our main app stable.
   - Verify `drizzle-orm` and Postgres client versions are compatible.

2. Auth & Middleware
   - Choose one auth provider: keep Clerk (our app) or adopt the starter’s JWT/session strategy.
   - If keeping Clerk: add `@clerk/nextjs` to `saas-starter`, wire `ClerkProvider` in `app/layout.tsx`, and reintroduce `authMiddleware` with public route matchers.

3. Database & RLS
   - Consolidate schemas: port our `server/db/schema.ts` tables (tenants, tenant_members, user_settings, audit_log) into the starter’s `lib/db` schema folder.
   - Maintain per-request DB creation (Neon HTTP) and plan for `set_config('app.tenant_id', ...)` in server actions/routes.
   - Run Drizzle migrations via the starter scripts and point `DATABASE_URL` to Neon.

4. Routing & Pages
   - Move our Next App Router pages (e.g., `app/dashboard`, `app/customers`, etc.) into `saas-starter/app/(app)` preserving segment conventions.
   - Map our global header to the starter’s shell; add OrganizationSwitcher/UserButton areas.

5. API & Webhooks
   - Recreate our API routes as Next route handlers under `saas-starter/app/api/*`.
   - Port Stripe webhook into `app/api/webhooks/stripe/route.ts` with verification.
   - For uploads, rewire to `@vercel/blob` with memory buffers only.

6. Env & Config
   - Merge `.env.example` sets from both projects; include `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, Clerk keys, Blob token (local only).

7. Gradual Cutover
   - Stand up `saas-starter` locally on port 3000 and validate: auth, DB connection, basic pages.
   - Incrementally move feature pages and APIs, testing after each migration.

## Acceptance Checklist (Current Status)
- [x] Auth flows (login, personal tenant bootstrap) work
- [x] Tenant list + active tenant switch via cookie
- [x] DB reads/writes support tenant via `withTenant` + `set_config`
- [ ] Stripe checkout and webhooks verified (seeded products only)
- [ ] File uploads (Blob) ported into starter
- [x] Production build passes locally (`pnpm build`)

## How to Run (Local)
```bash
cd saas-starter
pnpm install
cp ../.env.example .env # Fill POSTGRES_URL, STRIPE_*
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Production Build
```bash
cd saas-starter
pnpm build
```

## Environment Variables
- `POSTGRES_URL` (Neon with `?sslmode=require`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Optional: `CORS_ORIGIN` if adding cross-origin APIs

## Notes
- Keep changes small, favor serverless-friendly patterns, and avoid disk persistence.
 - Tenant KPIs are placeholders; wire real aggregates when domain tables are ready.
