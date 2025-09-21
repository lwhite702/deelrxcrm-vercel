# Extended Ops (Phase 2)

Adds inventory adjustments, customer referrals, deliveries, and loyalty basics.

APIs (all payloads validated with Zod; RBAC = manager+)

- GET/POST `/api/tenants/:tenantId/inventory/adjustments`
- GET/POST `/api/tenants/:tenantId/referrals`
- GET/POST `/api/tenants/:tenantId/deliveries`
- GET/PATCH/DELETE `/api/tenants/:tenantId/deliveries/:id`
- GET `/api/tenants/:tenantId/loyalty` (balances)
- POST `/api/tenants/:tenantId/loyalty/accrue`
- POST `/api/tenants/:tenantId/loyalty/redeem`

Enums

- `adjustment_reason`: waste, sample, personal, recount
- `delivery_method`: pickup, local, mail
- `loyalty_event_type`: accrual, redemption, adjustment

RBAC

- Uses `tenant_members.role` and requires manager+ for mutations.
- Clerk `currentUser()` determines `userId`; join `tenant_members` in server/rbac.ts.

Notes

- Field-level encryption candidates: delivery address, notes; loyaltyTransactions.description.
- RLS currently permissive; app-level tenant filters applied in queries.
