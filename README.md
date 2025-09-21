# DeelRx CRM

**🎉 Phase 1 Complete - Production Ready!**

A comprehensive multi-tenant CRM system with inventory management, customer relations, order processing, and payment handling. Built on Next.js 14 with serverless architecture for Vercel deployment.

**Production URL**: https://deelrxcrm.app

## 📋 Project Status

- ✅ **Phase 1: Core CRM** - Complete and production-ready
- 🔄 **Phase 2: Extended Operations** - Planned
- 📋 **Phase 3: Credit System & Support** - Future
- 🤖 **Phase 4: AI Intelligence** - Future
- 🚀 **Phase 5: Advanced Features** - Future

👉 **See [Project Phases](docs/PROJECT_PHASES.md) for detailed roadmap**

## 🚀 Quick Start

### For Business Users
The system is production-ready with these core features:
- **Product Management**: Complete inventory with stock tracking
- **Customer Management**: Comprehensive customer database
- **Order Processing**: Full order lifecycle management
- **Payment Processing**: Stripe integration with refunds
- **Business Intelligence**: Real-time KPIs and analytics

### For Developers

This system uses a modern serverless architecture:

- **Frontend**: Next.js 14 with App Router and TypeScript
- **Backend**: Serverless API routes with Drizzle ORM
- **Database**: Neon PostgreSQL with row-level security
- **Authentication**: Clerk with multi-tenant RBAC
- **Payments**: Stripe with webhook handling
- **Deployment**: Vercel serverless platform

## 📚 Documentation

- 📖 **[Project Phases](docs/PROJECT_PHASES.md)** - Development roadmap and current status
- 🚀 **[Deployment Guide](README-VERCEL.md)** - Step-by-step Vercel deployment
- 💾 **[Database Setup](DB-SETUP.md)** - Database configuration and migrations
- ⚙️ **[Environment Variables](docs/ENV_VARS.md)** - Required configuration
- 🔧 **[Core CRM Technical Spec](docs/CORE_CRM.md)** - Phase 1 implementation details
- 🧪 **[Smoke Testing](docs/SMOKE_TEST.md)** - Testing procedures

## Deployment

Production is deployed to: https://deelrxcrm.app

Quick deploy steps using the Vercel CLI:

Note: Vercel no longer accepts the runtime string `nodejs18.x` in function `config` objects. The codebase was updated to use `runtime: 'nodejs'` for server functions.

## Scripts

- `npm run dev`: Starts the Express server
- `npm run client:dev`: Starts the Vite dev server
- `npm run build`: Builds client and server
- `npm run issues:sync`: Reads `issues.yml`, ensures labels, creates issues if missing, and optionally populates a GitHub Project (v2) with a Phase field.
- `npm run issues:sync:project`: Convenience wrapper that unsets `GITHUB_TOKEN`, auto-detects the repo owner, and targets the project by title (defaults to `DeelRxCRM Roadmap`).

### Issues Sync and Project Population

- Create/update issues from `issues.yml`:
  ```bash
  npm run issues:sync
  ```
  - Shortcut with sensible defaults:
  ```bash
  # Uses auto-detected owner and project title (creates if missing)
  npm run issues:sync:project
  ```
- Add issues to a GitHub Project and set a Phase field (from `phase-*` labels):
  `bash
	# Option A (recommended): use the wrapper and project title
	unset GITHUB_TOKEN
	# Optional overrides
	export GH_PROJECT_TITLE="DeelRxCRM Roadmap"
	export GH_PROJECT_CREATE=1  # auto-create if missing
	export GH_PROJECT_ENSURE_PHASE=1  # ensure Phase field/options exist
	npm run issues:sync:project
\n+\t# Option B: call the script directly with explicit owner/number
	unset GITHUB_TOKEN
	export GH_PROJECT_OWNER="<org_or_user>"
	export GH_PROJECT_NUMBER="<project_number>"
	npm run issues:sync
	` - Optional envs: - `GH_PROJECT_TITLE` (default: `DeelRxCRM Roadmap`) - `GH_PROJECT_PHASE_FIELD` (default: `Phase`) - `GH_PROJECT_CREATE=1` to auto-create a project by title if missing - `GH_PROJECT_ENSURE_PHASE=0` to skip creating/editing the Phase field - Requires GitHub CLI auth with project scope: `gh auth login --scopes project,repo`
````

**Repository Layout**

- The project is consolidated into a single repository. The previous nested `DeelrzCRM` is now a regular folder at the repository root.
- Run the frontend server from `DeelrzCRM` for the full app and use top-level `README-VERCEL.md` for deployment instructions.
