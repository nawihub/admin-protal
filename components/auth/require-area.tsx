"use client";

import { usePermissions } from "@/lib/auth/use-permissions";
import type { Area } from "@/lib/auth/permissions";
import { Forbidden } from "@/components/auth/forbidden";

/** Page-level guard: renders the page only when the admin can read the area. */
export function RequireArea({ area, label, children }: { area: Area; label: string; children: React.ReactNode }) {
  const { canRead } = usePermissions();
  return canRead(area) ? <>{children}</> : <Forbidden area={label} />;
}
