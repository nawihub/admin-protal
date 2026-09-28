"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";

/**
 * Admin id -> display name, for audit entries (which only carry ids). Only fetched when the
 * viewer may list admins; otherwise names fall back to "an admin".
 */
export function useAdminNames() {
  const { canRead, user } = usePermissions();
  const enabled = canRead("adminUsers");
  const { data } = useQuery({
    queryKey: ["users", "names"],
    queryFn: () => usersApi.list({ size: 200 }),
    enabled,
    staleTime: 5 * 60_000,
  });
  const names = new Map<string, string>((data?.content ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
  if (user) names.set(user.id, "You");
  return (id: string | null | undefined) => {
    if (id?.startsWith("system")) return "System";
    return (id && names.get(id)) || "An admin";
  };
}
