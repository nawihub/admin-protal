"use client";

import { useState } from "react";
import { Crown, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { usersApi } from "@/lib/api/admin";
import type { ManagedUser } from "@/lib/api/types";

const EMPTY = { firstName: "", lastName: "", email: "", username: "" };

export function CreateUserDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreated: (u: ManagedUser) => void;
}) {
  const { isSuperAdmin } = usePermissions();
  const [form, setForm] = useState(EMPTY);
  const [fullAccess, setFullAccess] = useState(false);
  const create = useAction(() => usersApi.create({ ...form, fullAccess }), {
    success: (u) => `${u.firstName} added to the team`,
    invalidate: [["users"]],
  });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.firstName.trim() && form.lastName.trim() && /\S+@\S+\.\S+/.test(form.email) && form.username.trim().length >= 3;

  function close() {
    onOpenChange(false);
    setForm(EMPTY);
    setFullAccess(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an admin</DialogTitle>
          <DialogDescription>They sign in the first time with a one-time code, then choose a password. New admins start with view-only access.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate(undefined, { onSuccess: (u) => { close(); onCreated(u); } }); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="u-first">First name</Label><Input id="u-first" autoFocus value={form.firstName} onChange={set("firstName")} /></div>
            <div className="space-y-1.5"><Label htmlFor="u-last">Last name</Label><Input id="u-last" value={form.lastName} onChange={set("lastName")} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" value={form.email} onChange={set("email")} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="u-username">Username</Label><Input id="u-username" value={form.username} onChange={set("username")} autoComplete="off" /></div>
          </div>
          {isSuperAdmin && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
              <Checkbox checked={fullAccess} onCheckedChange={(c) => setFullAccess(c === true)} />
              <Crown className="size-4 text-secondary-500" />
              <span className="text-sm">Make them a <b>super admin</b> (full access)</span>
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Add admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
