export function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "A";
}

/** A short description of an admin's access level. */
export function roleLabel(permissions: string[]) {
  if (permissions.includes("FULL_ACCESS")) return "Super admin";
  const manages = permissions.filter((p) => p.startsWith("MANAGE_")).length;
  if (manages > 0) return `Moderator · ${permissions.length} permissions`;
  return "Viewer";
}
