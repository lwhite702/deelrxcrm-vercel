# DeelRx CRM on Vercel

Follow these steps to redeploy the monorepo as static Vite assets + serverless API on Vercel.

## 1. Install & test locally

```bash
npm install
npm run dev # starts Express locally at http://localhost:3000
npm run client:dev # optional Vite dev server at http://localhost:5173
```

Run quality gates before deploying:

```bash
npm run check
npm run build
```

`npm run build` emits the client to `dist/public` and bundles the Express entry for local prod emulation at `dist/index.js`. The static output is what Vercel serves from the project output directory.

## 2. Database & migrations

Drizzle targets Neon (or any Postgres URL). Set `DATABASE_URL` locally and in Vercel (include `?sslmode=require`) and push schema changes when required:

```bash
npm run db:push
```

This uses `drizzle.config.ts` and the schema defined in `server/db/schema.ts`.

## 3. Required environment variables

Configure these in both Vercel Preview and Production environments:

| Name | Description |
| ---- | ----------- |
| `DATABASE_URL` | Neon connection string (append `?sslmode=require`). |
| `CORS_ORIGIN` | Comma separated list of allowed origins (use `*` to allow all). |
| `STRIPE_SECRET_KEY` | Secret API key used by serverless functions. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the Stripe webhook endpoint. |
| `BLOB_READ_WRITE_TOKEN` | Only required when running locally; Vercel automatically injects this for deployments. |
| `ENCRYPTION_KEY` & other existing secrets | Carry over any app-specific secrets used by business logic. |

## 4. Vercel project settings

* **Build Command**: `npm run build`
* **Output Directory**: `dist/public`
* **Install Command**: `npm install`
* **Node.js Version**: 18+
* **Serverless Functions**: Provided automatically from the `api/` directory. A sample `vercel.json` is included to pin Node 18.

## 5. Serverless endpoints

* **API**: Express is exported through `api/index.ts`; routes live under `/api/*`.
* **Stripe webhook**: Deploys as `POST /api/webhooks/stripe`. Point your Stripe dashboard to that URL and supply `STRIPE_WEBHOOK_SECRET`.
* **Cron hooks**:
  * `POST /api/retention/enforce` – run nightly to expire attachments older than the retention threshold.
  * `POST /api/selfdestruct/sweep` – run on a tighter schedule to delete time-bombed assets.

Configure both endpoints as Vercel Cron Jobs (Settings → Functions → Cron Jobs) using HTTPS `POST` invocations.

## 6. File uploads

Uploads use in-memory `multer` buffers and stream them to [Vercel Blob](https://vercel.com/docs/storage/vercel-blob). Files are written with `access: "public"` so they can be rendered by the client, and delete requests call the Blob API to revoke objects. When testing locally, create a [Blob token](https://vercel.com/docs/storage/vercel-blob/working-locally) and set `BLOB_READ_WRITE_TOKEN`; in Preview/Production Vercel manages the token automatically.

## 7. Deployment checklist

1. Commit and push your changes.
2. Confirm Vercel env vars are populated (Preview + Prod).
3. In Vercel → Settings → Build & Development → Output Directory = `dist/public`.
4. Trigger a new deployment.
5. Add a Stripe webhook pointing at `/api/webhooks/stripe` (signing secret must match).
6. Schedule Cron jobs for retention + self-destruct if they are part of your data policy.
7. Verify uploads land in your Blob store and records insert into the Neon database.

Once deployed the static client is served from the generated assets and the API executes as Node serverless functions.

## Quick Deploy Checklist

Follow this short checklist when you trigger a deployment on Vercel:

1. In Vercel Project Settings -> Build & Development:
  - Install Command: `npm install`
  - Build Command: `npm run build`
  - Output Directory: `dist/public`
  - Node Version: confirm `18.x` (this repo pins `engines.node` in `package.json`).
2. Add required Environment Variables (Preview + Production): `DATABASE_URL`, `CORS_ORIGIN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ENCRYPTION_KEY`.
3. Confirm `vercel.json` is present at repository root (this project uses it to set function options).
4. Trigger deploy and monitor logs for any runtime errors.

### Stripe Webhook note

Point your Stripe webhook at:

```
https://<your-project>.vercel.app/api/webhooks/stripe
```

Be sure the `STRIPE_WEBHOOK_SECRET` set in Vercel matches the secret Stripe provides for that webhook. Use the Stripe CLI to test locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
