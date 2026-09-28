"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/data/page-header";
import { Section } from "@/components/data/detail";
import { PasswordRules, passwordValid } from "@/components/auth/password-rules";
import { initials, roleLabel } from "@/components/shell/user-initials";
import { usersApi } from "@/lib/api/admin";
import { PERMISSION_GROUPS, hasPermission } from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { AdminUser } from "@/lib/api/types";

function NameForm({ me }: { me: AdminUser }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [first, setFirst] = useState(me.firstName);
  const [last, setLast] = useState(me.lastName);
  const save = useAction(() => usersApi.updateProfile(me.id, first.trim(), last.trim()), {
    success: "Profile updated",
    invalidate: [["users"]],
  });
  const dirty = first.trim() !== me.firstName || last.trim() !== me.lastName;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => { e.preventDefault(); save.mutate(undefined, { onSuccess: (u) => setUser({ ...me, firstName: u.firstName, lastName: u.lastName }) }); }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="p-first">First name</Label><Input id="p-first" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="p-last">Last name</Label><Input id="p-last" value={last} onChange={(e) => setLast(e.target.value)} /></div>
      </div>
      <Button type="submit" disabled={!dirty || !first.trim() || !last.trim() || save.isPending}>
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const change = useAction(() => usersApi.changePassword(current, next), { success: "Password changed", invalidate: [] });
  const valid = current && passwordValid(next) && next === confirm && next !== current;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => { e.preventDefault(); if (valid) change.mutate(undefined, { onSuccess: () => { setCurrent(""); setNext(""); setConfirm(""); } }); }}
    >
      <div className="space-y-1.5"><Label htmlFor="pw-current">Current password</Label><Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="pw-new">New password</Label><Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
      <PasswordRules password={next} />
      <div className="space-y-1.5">
        <Label htmlFor="pw-confirm">Confirm new password</Label>
        <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {confirm && confirm !== next && <p className="text-xs text-error">Passwords don&apos;t match</p>}
      </div>
      <Button type="submit" disabled={!valid || change.isPending}>
        {change.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Change password
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const { user: me, isSuperAdmin, canRead } = usePermissions();
  // Email, username and sign-in stats come from the admin record (readable by admin-user viewers).
  const details = useQuery({ queryKey: ["users", "detail", me?.id], queryFn: () => usersApi.get(me!.id), enabled: !!me && canRead("adminUsers") });
  if (!me) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My Profile" description="Your details, password and what you have access to." />

      <div className="animate-fade-in-up relative mb-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="animate-drift pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-secondary-400/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="animate-scale-in relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-secondary-400 font-display text-2xl font-semibold text-white shadow-lg">
            {initials(me.firstName, me.lastName)}
            {isSuperAdmin && <Crown className="absolute -right-2 -top-2 size-7 rounded-full bg-card p-1 text-secondary-500 shadow" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-semibold">{me.firstName} {me.lastName}</h2>
            <p className="text-sm text-muted-foreground">{roleLabel(me.permissions)}</p>
            {details.data && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{details.data.email}</span><span>@{details.data.username}</span>
                <span>{details.data.loginCount} sign-ins</span><span>Member since {formatDate(details.data.createTime)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Your name" index={0}><NameForm me={me} /></Section>
        <Section title="Password" index={1}><PasswordForm /></Section>
        <Section title="Your access" index={2} className="lg:col-span-2">
          {isSuperAdmin && (
            <p className="mb-4 flex items-center gap-2 rounded-xl bg-secondary-400/10 p-3 text-sm"><Crown className="size-4 text-secondary-500" /> You have full access to everything.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.label} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{g.label}</p>
                <ul className="mt-2 space-y-1">
                  {g.permissions.map((p) => {
                    const ok = hasPermission(me, p.value);
                    return (
                      <li key={p.value} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-foreground" : "text-muted-foreground/60 line-through")}>
                        <ShieldCheck className={cn("size-3.5", ok ? "text-success" : "opacity-40")} /> {p.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
