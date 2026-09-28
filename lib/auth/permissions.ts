import type { AdminUser, Permission } from "@/lib/api/types";

/** The areas of the dashboard, each guarded by a read and a manage permission. */
export type Area = "bigIdeas" | "opportunities" | "businesses" | "entrepreneurs" | "resources" | "adminUsers" | "auditLogs";

export const AREA_PERMISSIONS: Record<Area, { read: Permission; manage?: Permission }> = {
  bigIdeas: { read: "READ_BIG_IDEAS", manage: "MANAGE_BIG_IDEAS" },
  opportunities: { read: "READ_OPPORTUNITIES", manage: "MANAGE_OPPORTUNITIES" },
  businesses: { read: "READ_BUSINESS", manage: "MANAGE_BUSINESS" },
  entrepreneurs: { read: "READ_ENTREPRENEUR", manage: "MANAGE_ENTREPRENEUR" },
  resources: { read: "READ_RESOURCES", manage: "MANAGE_RESOURCES" },
  adminUsers: { read: "READ_ADMIN_USER", manage: "MANAGE_ADMIN_USER" },
  auditLogs: { read: "READ_AUDIT_LOGS" },
};

/**
 * Mirrors admin-api-gateway's rules exactly: FULL_ACCESS grants everything, and the gateway
 * accepts either permission on reads (read OR manage) - so manage implies read here too.
 * The gateway is the real enforcement; this only decides what the UI offers.
 */
export function hasPermission(user: Pick<AdminUser, "permissions"> | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  const granted = user.permissions;
  if (granted.includes("FULL_ACCESS") || granted.includes(permission)) return true;
  if (permission.startsWith("READ_")) {
    return granted.includes(permission.replace("READ_", "MANAGE_") as Permission);
  }
  return false;
}

export function canRead(user: Pick<AdminUser, "permissions"> | null | undefined, area: Area) {
  return hasPermission(user, AREA_PERMISSIONS[area].read);
}

export function canManage(user: Pick<AdminUser, "permissions"> | null | undefined, area: Area) {
  const manage = AREA_PERMISSIONS[area].manage;
  return manage ? hasPermission(user, manage) : false;
}

/** Grouped for the permission editor. */
export const PERMISSION_GROUPS: { label: string; description: string; permissions: { value: Permission; label: string }[] }[] = [
  { label: "Big Ideas", description: "Idea submissions and their review", permissions: [
    { value: "READ_BIG_IDEAS", label: "View" }, { value: "MANAGE_BIG_IDEAS", label: "Review & manage" },
    { value: "READ_BIG_IDEA_DONATIONS", label: "View donations" } ] },
  { label: "Opportunities", description: "Funding calls, events and programs", permissions: [
    { value: "READ_OPPORTUNITIES", label: "View" }, { value: "MANAGE_OPPORTUNITIES", label: "Review & manage" } ] },
  { label: "Businesses", description: "Business registrations", permissions: [
    { value: "READ_BUSINESS", label: "View" }, { value: "MANAGE_BUSINESS", label: "Process registrations" } ] },
  { label: "Entrepreneurs", description: "Entrepreneur profiles", permissions: [
    { value: "READ_ENTREPRENEUR", label: "View" }, { value: "MANAGE_ENTREPRENEUR", label: "Vet, feature & suspend" } ] },
  { label: "Resources", description: "Resource library", permissions: [
    { value: "READ_RESOURCES", label: "View" }, { value: "MANAGE_RESOURCES", label: "Upload & moderate" } ] },
  { label: "Payouts", description: "Payout processing", permissions: [
    { value: "READ_PAYOUTS", label: "View" }, { value: "MANAGE_PAYOUTS", label: "Process" } ] },
  { label: "Administration", description: "Admin team and audit trail", permissions: [
    { value: "READ_ADMIN_USER", label: "View admins" }, { value: "MANAGE_ADMIN_USER", label: "Manage admins" },
    { value: "READ_AUDIT_LOGS", label: "View audit logs" } ] },
];
