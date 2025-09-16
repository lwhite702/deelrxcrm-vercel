# DeelRx CRM

This branch converts the DeelRx CRM stack into a Vercel-friendly deployment:

- Static client is bundled with Vite into `dist/public`.
- Express API is exported through serverless functions under `api/`.
- Database access uses Neon Postgres with per-request Drizzle clients.
- File uploads stream directly to Vercel Blob storage (no local disk).
- Stripe webhooks execute via `api/webhooks/stripe` using raw payload validation.

See [`README-VERCEL.md`](./README-VERCEL.md) for the step-by-step redeploy guide, environment variables, and cron job wiring.
