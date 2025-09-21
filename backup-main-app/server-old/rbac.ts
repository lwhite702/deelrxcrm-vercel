import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { tenantMembers, type TenantMember } from "./db/schema";
import { compareRoles, type Role } from "../lib/roles";

export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<Role | undefined> {
  const db = getDb();
  const row = await db.query.tenantMembers.findFirst({
    where: and(
      eq(tenantMembers.userId, userId),
      eq(tenantMembers.tenantId, tenantId)
    ),
  });
  return (row?.role as Role) || undefined;
}

export async function requireTenantRole(
  userId: string,
  tenantId: string,
  minRole: Role
): Promise<void> {
  const role = await getUserTenantRole(userId, tenantId);
  if (compareRoles(role as Role, minRole) > 0) {
    const e = new Error("Forbidden");
    // @ts-ignore custom code
    e.status = 403;
    throw e;
  }
}
