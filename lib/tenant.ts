import { db } from "./db/drizzle";
import { and, eq } from "drizzle-orm";
import {
  tenants,
  tenantMembers,
  userSettings,
  type Tenant,
  type TenantMemberMT,
  type UserSettings,
} from "./db/schema";
import { getSession } from "./auth/session";
import { cookies } from "next/headers";

export async function getCurrentUserId() {
  const session = await getSession();
  return session?.user.id ?? null;
}

export async function getUserSettings(userId: number) {
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return rows[0] as UserSettings | undefined;
}

export async function getPersonalTenant(userId: number) {
  const settings = await getUserSettings(userId);
  if (!settings?.personalTenantId) return undefined;
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, settings.personalTenantId));
  return rows[0] as Tenant | undefined;
}

export async function getMembership(userId: number, tenantId: string) {
  const rows = await db
    .select()
    .from(tenantMembers)
    .where(
      and(
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.tenantId, tenantId)
      )
    );
  return rows[0] as TenantMemberMT | undefined;
}

export async function ensurePersonalTenant(userId: number) {
  const settings = await getUserSettings(userId);
  if (settings?.personalTenantId) return settings.personalTenantId;

  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Personal", slug: `u-${userId}`, personal: true })
    .returning();

  await db
    .insert(tenantMembers)
    .values({ tenantId: tenant.id, userId, role: "owner" });
  await db
    .insert(userSettings)
    .values({ userId, personalTenantId: tenant.id })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { personalTenantId: tenant.id },
    });

  return tenant.id;
}

export async function listUserTenants(userId: number) {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      personal: tenants.personal,
    })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(eq(tenantMembers.userId, userId));
  return rows as Array<Pick<Tenant, "id" | "name" | "slug" | "personal">>;
}

export async function setActiveTenant(tenantId: string) {
  (await cookies()).set("active_tenant_id", tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getActiveTenant() {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;
  const cookieVal = (await cookies()).get("active_tenant_id")?.value;
  if (cookieVal) {
    const membership = await getMembership(userId, cookieVal);
    if (membership) {
      const rows = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, cookieVal));
      return rows[0] as Tenant | undefined;
    }
  }
  const personal = await getPersonalTenant(userId);
  if (personal) {
    await setActiveTenant(personal.id);
  }
  return personal ?? undefined;
}
