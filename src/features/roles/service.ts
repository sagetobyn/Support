import type { Role } from "@/types/domain";

export type Permission = "delete_workspace" | "queue_message" | "export_reports" | "run_simulation" | "edit_settings" | "reveal_phone" | "mutate_actions";

const permissions: Record<Role, Permission[]> = {
  admin: ["delete_workspace", "queue_message", "export_reports", "run_simulation", "edit_settings", "reveal_phone", "mutate_actions"],
  ops: ["queue_message", "mutate_actions"],
  analyst: ["export_reports", "run_simulation"],
  viewer: []
};

export function canRole(role: Role, permission: Permission) {
  return permissions[role].includes(permission);
}

export function roleLimitationMessage(role: Role, permission: Permission) {
  return canRole(role, permission) ? "" : `${role} role cannot ${permission.replaceAll("_", " ")} in Pro UI-level permissions.`;
}
