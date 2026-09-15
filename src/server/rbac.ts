import type { MemberRole } from "@prisma/client";

const PERMISSIONS = {
  "invoice.create": ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  "invoice.edit": ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  "invoice.delete": ["OWNER", "ADMIN", "MANAGER"],
  "invoice.view": ["OWNER", "ADMIN", "MANAGER", "STAFF", "VIEWER"],
  "report.view": ["OWNER", "ADMIN", "MANAGER", "VIEWER"],
  "customer.manage": ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  "product.manage": ["OWNER", "ADMIN", "MANAGER", "STAFF"],
  "payment.manage": ["OWNER", "ADMIN", "MANAGER"],
  "billing.manage": ["OWNER", "ADMIN"],
  "settings.manage": ["OWNER", "ADMIN"],
  "team.manage": ["OWNER", "ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: MemberRole, permission: Permission) {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function assertCan(role: MemberRole, permission: Permission) {
  if (!can(role, permission)) {
    const error = new Error("You do not have permission to do that.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}
