# Smoke Test (Phase 0)

Run after first deploy to verify critical paths.

1) Visit site root loads without error.
2) Clerk sign in page renders at `/login`.
3) Sign up a new user with Clerk and complete email verification.
4) App redirects to dashboard after auth.
5) Tenant bootstrap occurs or tenant selector loads.
6) Neon DB reachable: navigate to a page that queries DB without errors.
7) Upload a small file (if supported) and see success.
8) Stripe webhook endpoint returns 200 to a test event via Stripe CLI.
9) No console errors in browser for main pages.
10) Logs in Vercel show healthy responses (200/3xx) for pages and webhook.

If any step fails, check corresponding docs in `/docs` and environment variables.