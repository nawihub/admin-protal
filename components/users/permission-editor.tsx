"use client";

import { useState } from "react";
import { Check, Crown, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PERMISSION_GROUPS } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { usersApi } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { ManagedUser, Permission } from "@/lib/api/types";

/**
 * Edits an admin's permissions. Mirrors the gateway's rule: you can only grant permissions you
 * hold yourself, and only a super admin can grant full access.
 */
export function PermissionEditor({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {user && <Editor key={user.id} user={user} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function Editor({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
  const { user: me, isSuperAdmin } = usePermissions();
  const [selected, setSelected] = useState<Set<Permission>>(new Set(user.permissions));
  const full = selected.has("FULL_ACCESS");
  const grantable = (p: Permission) => isSuperAdmin || !!me?.permissions.includes(p);
  const save = useAction(() => usersApi.assignPermissions(user.id, [...selected]), {
    success: `Permissions updated for ${user.firstName}`,
    invalidate: [["users"]],
  });

  function toggle(p: Permission, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(p);
        // Managing an area needs seeing it.
        if (p.startsWith("MANAGE_")) next.add(p.replace("MANAGE_", "READ_") as Permission);
      } else {
        next.delete(p);
        if (p.startsWith("READ_")) next.delete(p.replace("READ_", "MANAGE_") as Permission);
      }
      return next;
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Permissions · {user.firstName} {user.lastName}</DialogTitle>
        <DialogDescription>Choose what this admin can see and do. Changes apply the next time their session refreshes.</DialogDescription>
      </DialogHeader>

      <button
        type="button"
        disabled={!isSuperAdmin}
        aria-pressed={full}
        onClick={() => toggle("FULL_ACCESS", !full)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
          full ? "border-secondary-400 bg-secondary-400/10 ring-4 ring-secondary-400/10" : "border-border hover:bg-muted/40",
        )}
      >
        <span className={cn("flex size-10 items-center justify-center rounded-xl transition-colors", full ? "bg-secondary-400 text-white" : "bg-muted text-muted-foreground")}>
          <Crown className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Full access</span>
          <span className="text-xs text-muted-foreground">Super admin: everything, including managing other admins.{!isSuperAdmin && " Only super admins can grant this."}</span>
        </span>
        {/* Visual only - the whole card is the toggle (a Checkbox would nest a button in a button). */}
        <span aria-hidden className={cn("flex size-4 items-center justify-center rounded-md border transition-colors", full ? "border-secondary-400 bg-secondary-400 text-white" : "border-input")}>
          {full && <Check className="size-3" />}
        </span>
      </button>

      <div className={cn("grid gap-3 transition-opacity sm:grid-cols-2", full && "pointer-events-none opacity-40")}>
        {PERMISSION_GROUPS.map((g, gi) => (
          <div key={g.label} className="stagger-in rounded-xl border border-border p-3" style={{ "--stagger": gi } as React.CSSProperties}>
            <p className="text-sm font-medium">{g.label}</p>
            <p className="mb-2 text-xs text-muted-foreground">{g.description}</p>
            <div className="space-y-1.5">
              {g.permissions.map((p) => {
                const allowed = grantable(p.value);
                return (
                  <label key={p.value} className={cn("flex items-center gap-2 text-sm", allowed ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground")}>
                    <Checkbox checked={full || selected.has(p.value)} disabled={!allowed || full} onCheckedChange={(c) => toggle(p.value, c === true)} />
                    {p.label}
                    {!allowed && <Lock className="size-3" aria-label="You don't hold this permission" />}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />} Save permissions
        </Button>
      </DialogFooter>
    </>
  );
}
