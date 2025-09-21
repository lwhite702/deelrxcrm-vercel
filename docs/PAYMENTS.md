# Payments (Stripe Test Wiring)

This project includes a Stripe webhook route at `/api/webhooks/stripe` (Next.js App Router) with raw body signature verification.

Setup
- Create a Stripe account and get test keys.
- Set env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- In Stripe Dashboard → Developers → Webhooks, add an endpoint pointing to your deployed URL `/api/webhooks/stripe`.

Local testing
- Start the app: `npm run dev:next`
- Forward events using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
- Copy the signing secret printed by the CLI into `.env` as `STRIPE_WEBHOOK_SECRET`.

Test cards
- 4242 4242 4242 4242 — Any future expiry, any CVC
- 4000 0025 0000 3155 — Requires 3DS
- 4000 0000 0000 9995 — Insufficient funds

Notes
- The handler currently acknowledges events and is ready to be extended in later phases.
- Server code: `app/api/webhooks/stripe/route.ts` and `server/stripe/handlers.ts`.