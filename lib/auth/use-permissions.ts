"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import { canManage, canRead, hasPermission, type Area } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/api/types";

/** Permission checks bound to the signed-in admin. */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  return {
    user,
    has: (permission: Permission) => hasPermission(user, permission),
    canRead: (area: Area) => canRead(user, area),
    canManage: (area: Area) => canManage(user, area),
    isSuperAdmin: Boolean(user?.permissions.includes("FULL_ACCESS")),
  };
}
