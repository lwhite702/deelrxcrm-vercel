# Data Model (Phases 0–2)

Core

- tenants (id, slug, name, personal)
- tenant_members (tenant_id, user_id, role)
- user_settings (user_id, personal_tenant_id)
- attachments, audit_log

Phase 2 additions

- inventory_adjustments: tenant_id, item, quantity, reason, note
- customer_referrals: tenant_id, referrer, referred, note
- deliveries: tenant_id, method, cost_cents, address (json), notes
- loyalty_programs: tenant_id, name, points_per_currency, redeem_rate
- loyalty_accounts: tenant_id, customer_id, balance
- loyalty_events: tenant_id, account_id, type, points, metadata
- loyalty_transactions: tenant_id, account_id, points, description

Relationships

- tenant_members.user_id belongs to auth user (Clerk) — app-level join
- loyalty_accounts unique per tenant+customer
- events/transactions reference accounts

Security

- RLS enabled on all tables; permissive for now.
- App enforces tenant scoping + RBAC (manager+ for mutations).
