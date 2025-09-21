# DeelRx CRM

This branch converts the DeelRx CRM stack into a Vercel-friendly deployment:


See [`README-VERCEL.md`](./README-VERCEL.md) for the step-by-step redeploy guide, environment variables, and cron job wiring.
For database setup and scripts, see [`DB-SETUP.md`](./DB-SETUP.md).
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


Note: Vercel no longer accepts the runtime string `nodejs18.x` in function `config` objects. The codebase was updated to use `runtime: 'nodejs'` for server functions.

## Scripts

 - `npm run dev`: Starts the Express server
 - `npm run client:dev`: Starts the Vite dev server
 - `npm run build`: Builds client and server
 - `npm run issues:sync`: Reads `issues.yml`, ensures labels, creates issues if missing, and optionally populates a GitHub Project (v2) with a Phase field.

### Issues Sync and Project Population

 - Create/update issues from `issues.yml`:
	```bash
	npm run issues:sync
	```
 - Add issues to a GitHub Project and set a Phase field (from `phase-*` labels):
	```bash
	# Recommended: specify owner and project number
	unset GITHUB_TOKEN
	export GH_PROJECT_OWNER="<org_or_user>"
	export GH_PROJECT_NUMBER="<project_number>"
	npm run issues:sync
	```
	- Optional envs:
		- `GH_PROJECT_TITLE` (default: `DeelRxCRM Roadmap`)
		- `GH_PROJECT_PHASE_FIELD` (default: `Phase`)
		- `GH_PROJECT_CREATE=1` to auto-create a project by title if missing
		- `GH_PROJECT_ENSURE_PHASE=0` to skip creating/editing the Phase field
	- Requires GitHub CLI auth with project scope: `gh auth login --scopes project,repo`
```


**Repository Layout**

- The project is consolidated into a single repository. The previous nested `DeelrzCRM` is now a regular folder at the repository root.
- Run the frontend server from `DeelrzCRM` for the full app and use top-level `README-VERCEL.md` for deployment instructions.
