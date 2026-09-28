"use client";

import { usePermissions } from "@/lib/auth/use-permissions";
import type { Area } from "@/lib/auth/permissions";

/** Renders children only when the admin may perform `action` on `area` (optionally a fallback). */
export function Can({
  area,
  action = "read",
  children,
  fallback = null,
}: {
  area: Area;
  action?: "read" | "manage";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canRead, canManage } = usePermissions();
  const allowed = action === "manage" ? canManage(area) : canRead(area);
  return <>{allowed ? children : fallback}</>;
}
