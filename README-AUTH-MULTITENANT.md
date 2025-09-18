# DeelRxCRM Auth & Multi-Tenancy Architecture

This document defines the authentication + multi-tenancy model using Clerk + Postgres (Neon) + RLS. It is the implementation guide and contract for routes, database access, and tenancy isolation.

## Goals

- Clerk authentication: support personal (solo) workspaces and multi-user organizations.
- Clean URL model:
  - Personal workspace: `/me/...`
  - Organization / tenant workspace: `/t/:tenantSlug/...`
- Enforce data isolation with Postgres Row Level Security (RLS) using a session-local `app.tenant_id`.
- Zero long‑lived DB pools (serverless friendly on Vercel + Neon HTTP or pg).
- Webhooks keep Clerk Organizations in sync with our `tenants` + `tenant_members` tables.
- Automatic personal tenant bootstrap on first sign-in.
- Optional Redis (rate limit / short-lived cache) – not required.

## Environment Variables

Configure in Vercel Project Settings:

```
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER=   # if using JWT templates (optional)
DATABASE_URL=       # Neon Postgres (include ?sslmode=require if needed)
APP_URL=https://deelrxcrm.app
```

Optional (if later adding Redis):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## URL & Routing Contract

| Path Pattern        | Description                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`                 | Landing / marketing. Redirects: signed-out → `/login`, signed-in → last used tenant or `/me/dashboard`. |
| `/login`, `/signup` | Auth entry points with Clerk `<SignIn>` / `<SignUp>`.                                                   |
| `/user`             | Clerk `<UserProfile>`                                                                                   |
| `/org`              | Clerk `<OrganizationProfile>`                                                                           |
| `/me/*`             | Personal tenant routes (isolated)                                                                       |
| `/t/:tenantSlug/*`  | Organization tenant routes                                                                              |

## Database Schema (Core)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('personal','organization')),
  clerk_org_id text UNIQUE,          -- null for personal
  owner_user_id text,                -- Clerk user id for personal tenant
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE tenant_role AS ENUM ('owner','admin','member','viewer');

CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role tenant_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id text PRIMARY KEY,
  last_used_tenant_id uuid REFERENCES tenants(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  at timestamptz NOT NULL DEFAULT now(),
  actor_user_id text,
  tenant_id uuid,
  action text NOT NULL,
  details jsonb
);

-- Example tenant-scoped domain table (products)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text NOT NULL,
  qty int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
```

### Session Tenant & RLS

Helper schema + function:

```sql
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true),'')::uuid;
$$;
```

Enable RLS & policy for each tenant table:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());
```

Per-request binding in application code BEFORE queries:

```sql
SELECT set_config('app.tenant_id', '<TENANT_UUID>', true);
```

All subsequent statements in that session obey RLS.

## Role Model

| Role   | Permissions (baseline)                                       |
| ------ | ------------------------------------------------------------ |
| owner  | Full control, manage members, billing, dangerous actions     |
| admin  | Manage standard config, invite members, CRUD domain entities |
| member | Standard CRUD within tenant                                  |
| viewer | Read-only                                                    |

Map Clerk organization roles:

- First org member → `owner`
- `org:admin` → `admin`
- `org:member` → `member`
  (Custom mapping extension point in `lib/roles.ts`).

## Lib Structure

```
lib/
  db.ts          # createClient(), withTenant(), simple query helpers
  tenant.ts      # getActiveTenant(), resolve from URL + membership
  roles.ts       # role mapping + hasRole()
  rls.ts         # (optional) helpers for set_config binding
```

### db.ts (pattern sketch)

```ts
import { Pool } from "pg";
// For Neon serverless consider @neondatabase/serverless - but keep a light wrapper.

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function withTenant(
  tenantId: string,
  fn: (client: any) => Promise<any>
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config($1,$2,true)", [
      "app.tenant_id",
      tenantId,
    ]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
```

### tenant.ts (outline)

```ts
import { auth } from "@clerk/nextjs";
import { cache } from "react";
import { withTenant } from "./db";

export async function getActiveTenant(params: { pathname: string }) {
  const { userId, orgId } = auth();
  if (!userId) throw new Error("Unauthenticated");
  // parse pathname: /t/:slug or /me
  // look up tenant by slug (or personal via owner_user_id)
  // verify membership (tenant_members)
  return { id, slug, kind, role };
}
```

## Clerk Integration

- Wrap `app/layout.tsx` with `<ClerkProvider>`.
- Middleware (`middleware.ts`) using `authMiddleware` with Node runtime (avoid Edge issues):

```ts
import { authMiddleware } from "@clerk/nextjs";
export default authMiddleware({
  publicRoutes: ["/", "/login", "/signup", "/robots.txt"],
});
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
  runtime: "nodejs",
};
```

- Auth pages under `app/(auth)/`:
  - `login/page.tsx` → `<SignIn path="/login" />`
  - `signup/page.tsx` → `<SignUp path="/signup" />`
  - `user/page.tsx` → `<UserProfile />`
  - `org/page.tsx` → `<OrganizationProfile />`

### Personal Tenant Bootstrap

On sign-in (e.g. route handler or after auth callback):

1. Check `tenants` for `owner_user_id = userId`.
2. If missing: create tenant (slug suggestion: clerkUser.username or `user-${shortId}`), insert membership as owner.
3. Upsert `user_settings.last_used_tenant_id`.
4. Redirect to `/me/dashboard`.

## Webhooks (Clerk ↔ Tenants)

Route: `app/api/clerk/webhooks/route.ts`
Events consumed:

- `organization.created` → insert tenant(kind='organization', slug sanitized from name, clerk_org_id)
- `organization.updated` → sync name, maybe slug if changed
- `organizationMembership.created` → upsert tenant_members (role map)
- `organizationMembership.updated` → update role
- `organizationMembership.deleted` → delete membership

### Role Mapping Helper

`roles.ts`:

```ts
export function mapClerkRole(evt: string, isFirst = false): string {
  if (isFirst) return "owner";
  if (evt === "org:admin") return "admin";
  return "member";
}
```

## Header UI

Add a shared header component with:

```tsx
<OrganizationSwitcher afterCreateOrganizationUrl={(org)=>`/t/${org.slug}/dashboard`} />
<UserButton afterSignOutUrl="/login" />
```

When switching:

- If personal → `/me/dashboard`
- If org → `/t/:slug/dashboard`
  Use router push + map slug from local cache or DB.

## RLS Test Script (outline)

`scripts/rls-test.ts`:

1. Create two tenants A & B.
2. Add user1 to A, user2 to B.
3. Insert products into both.
4. Run `withTenant(A)` as user1 → can read A, cannot read B.
5. Run `withTenant(B)` as user1 → zero rows (RLS enforced).
6. Log pass/fail.

## Optional Redis

Use Upstash only for:

- Rate limiting (e.g. org creation, invites)
- Short-lived cache of tenant slug → id lookups: set TTL 30–60s
  Not required for core correctness.

## Deployment Notes

- Add migrations and run Drizzle/SQL push before enabling RLS in production.
- Ensure all tenant tables have RLS BEFORE writing sensitive data.
- Monitor for accidental missing `tenant_id` columns; add constraint checks.

## Acceptance Checklist

- First sign-in creates personal tenant and redirects to `/me/dashboard`.
- Creating a Clerk Organization triggers webhook and new tenant shows in switcher.
- Membership/role changes propagate via webhook.
- All `/t/:slug/*` and `/me/*` queries are tenant filtered (RLS proven by test script).
- No global connection pooling beyond what Neon/pg supports for serverless.

## Implementation Status (Live Code Tracking)

Implemented so far:

- `lib/db.ts` basic Neon HTTP wrapper (no session set_config yet)
- `lib/tenant.ts` placeholder tenant resolvers
- `lib/roles.ts` role precedence + helpers
- `lib/bootstrap.ts` personal tenant creation helper (not yet wired into auth flow)
- Migration draft: `drizzle/0001_multitenancy.sql` (initial tables + permissive RLS to be tightened)
- Webhook scaffold: `app/api/clerk/webhooks/route.ts` (signature + event handling TODO)
- Layout placeholders: `app/t/[tenant]/layout.tsx`, `app/me/layout.tsx`
- Global header: `app/components/GlobalHeader.tsx` with `OrganizationSwitcher` + `UserButton`

Pending / Next:

- Tighten RLS policies to `app.current_tenant_id()` once session binding implemented.
- Implement webhook signature verification and event-specific logic.
- Wire `ensurePersonalTenant` into sign-in flow (e.g. after auth callback or layout effect once user loads).
- Add `products` or other domain tables with tenant_id columns to exercise RLS.
- Add `scripts/rls-test.ts` to validate isolation end-to-end.


## Follow-Up Enhancements

- Add caching layer for `getActiveTenant`.
- Add invitation UI bridging Clerk invites to in-app notifications.
- Extend audit_log usage for security / compliance.
- Add billing integration keyed by tenant_id.
