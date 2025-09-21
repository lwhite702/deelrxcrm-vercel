# Environment Variables

Set these in local `.env` and in Vercel Project Settings → Environment Variables.

- `NEXT_PUBLIC_SITE_URL`: Public site base URL (e.g., http://localhost:3000, https://deelrxcrm.app)
- `DATABASE_URL`: Neon Postgres URL with `sslmode=require`
- `DATABASE_URL_UNPOOLED`: Optional unpooled URL for Drizzle codegen
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`: Clerk auth keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Auth routes
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe API keys (test for Phase 0)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `BLOB_READ_WRITE_TOKEN`: Local dev uploads to Vercel Blob
- `NEXT_PUBLIC_SUPER_ADMIN_USER_IDS`: Comma-separated Clerk user IDs with super-admin access

Tips
- Ensure `sslmode=require` is present in `DATABASE_URL`.
- In Vercel, set each env to the same value across Production/Preview/Development as needed.