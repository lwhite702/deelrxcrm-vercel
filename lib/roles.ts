export const ROLE_PRIORITY = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
] as const;
export type Role = (typeof ROLE_PRIORITY)[number];

export function compareRoles(a?: Role, b?: Role) {
  return (
    (ROLE_PRIORITY.indexOf(a as Role) ?? 99) -
    (ROLE_PRIORITY.indexOf(b as Role) ?? 99)
  );
}

export function canManageUsers(role?: Role) {
  return role === "owner" || role === "admin";
}

export function canEditData(role?: Role) {
  return role === "owner" || role === "admin" || role === "manager";
}
