# Vercel Deployment (Phase 0)

This repo runs as a Next.js App Router app on Vercel with Neon Postgres.

1) Fork and import
- Fork `lwhite702/deelrxcrm-vercel` to your GitHub.
- In Vercel, import the repo. Framework preset: Next.js.

2) Environment variables
Set the following in Vercel Project Settings → Environment Variables:
- `NEXT_PUBLIC_SITE_URL` → `https://<your-domain>`
- `DATABASE_URL` → Neon connection string with `sslmode=require`
- `DATABASE_URL_UNPOOLED` (optional) → unpooled URL
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPER_ADMIN_USER_IDS` → optional
- `BLOB_READ_WRITE_TOKEN` → not required in Vercel (built-in), useful locally

3) Build settings
- Root: repository root
- Install command: `npm install`
- Build command: `npm run build:next`
- Output directory: `.vercel/output` (managed by Next; no change needed)

4) Database
- Create Neon database; set `DATABASE_URL` in Vercel.
- Run migrations locally (recommended):
```bash
npm run db:push
```
- Or use a GitHub Action/CI step to apply migrations on deploy.

5) Stripe webhook
- In Stripe Dashboard → Webhooks, add endpoint `https://<your-domain>/api/webhooks/stripe`.
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel.

6) Domains
- Add your domain in Vercel → Domains.

7) Smoke test
- Follow `docs/SMOKE_TEST.md` after first deployment.

Troubleshooting
- 500 on webhook: verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- DB errors: confirm `sslmode=require` and database is reachable from Vercel.