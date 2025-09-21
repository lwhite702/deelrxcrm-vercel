-- Enable Row Level Security and policies for multi-tenant tables

-- Tenants table: allow access only to members of the tenant
alter table if exists tenants enable row level security;
drop policy if exists tenants_is_member on tenants;
create policy tenants_is_member on tenants
  for select using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenants.id
        and (current_setting('app.user_id', true))::int = tm.user_id
    )
  );

-- Tenant members table: user sees rows for their tenants
alter table if exists tenant_members enable row level security;
drop policy if exists tenant_members_is_member on tenant_members;
create policy tenant_members_is_member on tenant_members
  for select using (
    tenant_members.tenant_id = (current_setting('app.tenant_id', true))::uuid
  );

-- User settings: only for current user
alter table if exists user_settings enable row level security;
drop policy if exists user_settings_is_owner on user_settings;
create policy user_settings_is_owner on user_settings
  for select using (
    user_settings.user_id = (current_setting('app.user_id', true))::int
  );

-- Audit log: scoped by active tenant
alter table if exists audit_log enable row level security;
drop policy if exists audit_log_same_tenant on audit_log;
create policy audit_log_same_tenant on audit_log
  for select using (
    audit_log.tenant_id = (current_setting('app.tenant_id', true))::uuid
  );
