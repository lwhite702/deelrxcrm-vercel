<!-- Copilot instructions for DeelRx CRM (Vercel deployment) -->

# Copilot Usage Hints

This repository is a Vite React client bundled into `dist/public` and an Express API exported as Vercel serverless functions under `api/`.

- **Entry points**: `src/main.tsx` (client) and `server/index.ts` (server). Vercel uses `api/index.ts` which exports the Express app via `serverless-http`.
- **Server composition**: `server/app.ts` builds the Express app and registers routes from `server/routes/*`.
- **Database**: Drizzle ORM + Neon HTTP client. Schema: `server/db/schema.ts`. Runtime DB access uses `server/db.ts` -> `getDb()`.
- **Uploads**: In-memory `multer` buffers are streamed to Vercel Blob via `server/blob.ts`. Upload routes live in `server/routes/uploads.ts` and the API surface is `/api/uploads`.
- **Webhooks**: Stripe webhook is implemented at `api/webhooks/stripe.ts` and validates the raw request using `STRIPE_WEBHOOK_SECRET`. Business logic lives in `server/stripe/handlers.ts`.
- **Webhooks**: Stripe webhook is implemented at `api/webhooks/stripe.ts` and validates the raw request using `STRIPE_WEBHOOK_SECRET`. Business logic lives in `server/stripe/handlers.ts`.

**Production site:** `https://deelrxcrm.app`

Key patterns and expectations for code changes

- Prefer small, well-scoped changes that are backwards compatible with Vercel serverless execution (stateless handlers, small memory footprint).
- Do not write code that depends on local disk persistence; file uploads stream to Blob storage and the codebase assumes `multer.memoryStorage()`.
- Use `getDb()` for each request to obtain a per-request Drizzle client (Neon HTTP). Do not reuse a long-lived DB client across requests.
- Respect the existing error-handling pattern in `server/app.ts`: return JSON error responses and let the global error handler produce safe messages in production.

Build / dev workflow (examples)

- Local app (Express):
  - `npm install`
  - `npm run dev` # starts Express server on `PORT` (default 3000)
  - `npm run client:dev` # optional Vite dev server for client at 5173
- Production build (what Vercel runs):
  - `npm run build` # emits `dist/public` and bundles `server/index.ts` into `dist/`
  - Output directory: `dist/public` (set in Vercel project settings)

Database & migrations

- Drizzle config: `drizzle.config.ts` points to `server/db/schema.ts`.
- Push migrations with: `npm run db:push`. Ensure `DATABASE_URL` includes `?sslmode=require` when pointing at Neon.

Secrets & environment variables (must exist in Vercel)

- `DATABASE_URL` (Neon Postgres)
- `CORS_ORIGIN` (comma-separated allowed origins)
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (Stripe webhooks)
- `BLOB_READ_WRITE_TOKEN` (only needed locally; Vercel injects automatically)

Files and locations to reference when making changes

- API export: `api/index.ts`
- Server app: `server/app.ts`, `server/index.ts`
- Routes: `server/routes/*` (example: `uploads.ts`, `health.ts`)
- Blob helpers: `server/blob.ts`
- DB schema and types: `server/db/schema.ts`, `server/db.ts`
- Stripe handlers: `server/stripe/handlers.ts`
- Vercel settings: `vercel.json`, `README-VERCEL.md`

Testing tips

- Use the Stripe CLI to forward events locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set).
- Use the Stripe CLI to forward events locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set). For production verification use `https://deelrxcrm.app/api/webhooks/stripe` and set the webhook secret in Vercel.
- To emulate production assets locally, run `npm run build` then `node dist/index.js`.

When in doubt

- Follow the existing conventions: stateless serverless functions, stream uploads to `@vercel/blob`, and use `getDb()` per-request.
- If your change affects deployment (build output path, function runtimes), update `README-VERCEL.md` and `vercel.json` accordingly and add steps to the README.

If anything here is unclear or you need more examples (tests, advanced debug), ask for clarification and point to the file or behavior you want to modify.
