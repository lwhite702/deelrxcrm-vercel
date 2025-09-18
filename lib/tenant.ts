// Placeholder tenant utilities; will integrate Clerk + DB lookups.

export interface ActiveTenant {
  id: string;
  slug: string;
  name: string;
  isPersonal: boolean;
  role?: string;
}

export async function getActiveTenantFromParams(params: {
  tenant?: string;
}): Promise<ActiveTenant | null> {
  if (!params.tenant) return null;
  // TODO: query tenants table by slug; for now fabricate.
  return {
    id: `tenant_${params.tenant}`,
    slug: params.tenant,
    name: params.tenant
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    isPersonal: false,
  };
}

export async function getPersonalTenant(
  userId: string
): Promise<ActiveTenant | null> {
  // TODO: lookup user_settings.personal_tenant_id join tenants.
  return null;
}
