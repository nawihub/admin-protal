"use client";

import { usePermissions } from "@/lib/auth/use-permissions";
import type { Area } from "@/lib/auth/permissions";
import { Forbidden } from "@/components/auth/forbidden";

/**
 * Page-level guard: renders the page only when the admin can read the area - or, with
 * {@code manage}, change things in it (for create/edit pages).
 */
export function RequireArea({ area, label, manage = false, children }: { area: Area; label: string; manage?: boolean; children: React.ReactNode }) {
  const { canRead, canManage } = usePermissions();
  return (manage ? canManage(area) : canRead(area)) ? <>{children}</> : <Forbidden area={label} />;
}
