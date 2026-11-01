export type Role = "owner" | "admin" | "support";

export type Permission = 
  | "view_all" 
  | "review_orders" 
  | "manage_users" 
  | "manage_admins";

export const PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["view_all", "review_orders", "manage_users", "manage_admins"],
  admin: ["view_all", "review_orders", "manage_users"],
  support: ["view_all"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}