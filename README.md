# DeelRx CRM

This branch converts the DeelRx CRM stack into a Vercel-friendly deployment:


See [`README-VERCEL.md`](./README-VERCEL.md) for the step-by-step redeploy guide, environment variables, and cron job wiring.
```markdown
# DeelRx CRM

This branch converts the DeelRx CRM stack into a Vercel-friendly deployment:

- Static client is bundled with Vite into `dist/public`.
- Express API is exported through serverless functions under `api/`.
- Database access uses Neon Postgres with per-request Drizzle clients.
- File uploads stream directly to Vercel Blob storage (no local disk).
- Stripe webhooks execute via `api/webhooks/stripe` using raw payload validation.

See [`README-VERCEL.md`](./README-VERCEL.md) for the step-by-step redeploy guide, environment variables, and cron job wiring.

## Deployment

Production is deployed to: https://deelrxcrm.app

Quick deploy steps using the Vercel CLI:

- Install the CLI (if needed): `npm install -g vercel`
- Login: `vercel login`
- Link the project (one-time): `vercel link`
- Deploy production (non-interactive): `vercel deploy --prod --yes`

Note: Vercel no longer accepts the runtime string `nodejs18.x` in function `config` objects. The codebase was updated to use `runtime: 'nodejs'` for server functions.

```
