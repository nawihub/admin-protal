"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Ban, ChevronLeft, ChevronRight, Crown, Eye, KeyRound, Lock, Minus, MoreHorizontal, PlayCircle, RotateCcw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RequireArea } from "@/components/auth/require-area";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { ViewToggle } from "@/components/data/view-toggle";
import { Tile, gradientFor } from "@/components/cards/tile";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog } from "@/components/data/action-dialogs";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { PermissionEditor } from "@/components/users/permission-editor";
import { OneTimeCodeDialog } from "@/components/users/one-time-code-dialog";
import { initials, roleLabel } from "@/components/shell/user-initials";
import { usersApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { AREA_PERMISSIONS, canManage, canRead, type Area } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { useAdminCount } from "@/lib/queries/counts";
import { timeAgo } from "@/lib/format";
import type { ManagedUser } from "@/lib/api/types";

const PAGE_SIZE = 20;
type Confirm = { kind: "deactivate" | "reset" | "delete"; user: ManagedUser };

function RowActions({ user, onAction }: { user: ManagedUser; onAction: (a: "permissions" | "code" | "activate" | Confirm["kind"]) => void }) {
  const { user: me, isSuperAdmin } = usePermissions();
  if (me?.id === user.id) return <Tag tone="brand">You</Tag>;
  // Only super admins can change a super admin's account (enforced by the gateway too).
  if (!isSuperAdmin && user.permissions.includes("FULL_ACCESS")) {
    return <Lock className="ml-auto size-4 text-muted-foreground" aria-label="Only super admins can change this account" />;
  }
  return (
    <Can area="adminUsers" action="manage">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.firstName}`} onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => onAction("permissions")}><ShieldCheck className="size-4" /> Edit permissions</DropdownMenuItem>
          {user.status === "PENDING" && <DropdownMenuItem onSelect={() => onAction("code")}><KeyRound className="size-4" /> Show sign-in code</DropdownMenuItem>}
          {user.status !== "DISABLED" && <DropdownMenuItem onSelect={() => onAction("reset")}><RotateCcw className="size-4" /> Reset password</DropdownMenuItem>}
          <DropdownMenuSeparator />
          {user.status === "DISABLED" ? (
            <DropdownMenuItem onSelect={() => onAction("activate")}><PlayCircle className="size-4" /> Re-enable</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onAction("deactivate")}><Ban className="size-4" /> Disable</DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-error focus:text-error" onSelect={() => onAction("delete")}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Can>
  );
}


const AREA_LABELS: [Area, string][] = [
  ["bigIdeas", "Ideas"], ["opportunities", "Opportunities"], ["businesses", "Businesses"],
  ["entrepreneurs", "Entrepreneurs"], ["resources", "Resources"], ["adminUsers", "Admins"], ["auditLogs", "Audit"],
];

/** An admin as a card: identity, role and a per-area access map (view / manage). */
function AdminCard({ user, actions, onOpen }: { user: ManagedUser; actions: React.ReactNode; onOpen?: () => void }) {
  const name = `${user.firstName} ${user.lastName}`;
  const superAdmin = user.permissions.includes("FULL_ACCESS");
  return (
    <Tile>
      <div className="relative flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn(
            "relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-lg font-semibold text-white shadow-md transition-transform duration-slow ease-spring group-hover:-rotate-3 group-hover:scale-105",
            gradientFor(name),
          )}>
            {initials(user.firstName, user.lastName)}
            {superAdmin && <Crown className="absolute -right-2 -top-2 size-6 rounded-full bg-card p-1 text-secondary-500 shadow" aria-label="Super admin" />}
          </span>
          <div className="relative z-[2] flex items-center gap-1">
            <StatusBadge status={user.status} label={user.status === "PENDING" ? "Invited" : undefined} />
            {actions}
          </div>
        </div>
        <div className="min-w-0">
          {onOpen ? (
            <button type="button" onClick={onOpen} className="truncate text-left font-display text-lg font-semibold outline-none after:absolute after:inset-0 after:z-[1] after:content-[''] group-hover:text-primary-700 dark:group-hover:text-primary-300">
              {name}
            </button>
          ) : (
            <p className="truncate font-display text-lg font-semibold">{name}</p>
          )}
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{roleLabel(user.permissions)}</p>
        </div>
        <ul className="grid grid-cols-2 gap-1.5 text-xs" aria-label="Access by area">
          {AREA_LABELS.map(([area, label], i) => {
            const manage = AREA_PERMISSIONS[area].manage && canManage(user, area);
            const read = canRead(user, area);
            return (
              <li
                key={area}
                title={`${label}: ${manage ? "can manage" : read ? "can view" : "no access"}`}
                className={cn(
                  "stagger-in flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1",
                  manage ? "bg-primary-500/10 text-primary-700 dark:text-primary-300" : read ? "bg-muted text-foreground" : "text-muted-foreground/50",
                )}
                style={{ "--stagger": i } as React.CSSProperties}
              >
                {manage ? <ShieldCheck className="size-3.5 shrink-0" /> : read ? <Eye className="size-3.5 shrink-0" /> : <Minus className="size-3.5 shrink-0" />}
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-auto border-t border-border/70 pt-3 text-xs text-muted-foreground">
          {user.lastLoginTime ? `Last signed in ${timeAgo(user.lastLoginTime)}` : "Hasn't signed in yet"} · {user.loginCount} sign-ins
        </p>
      </div>
    </Tile>
  );
}

function Team() {
  const router = useRouter();
  const params = useSearchParams();
  const { canRead: viewerCanRead } = usePermissions();
  const { values, update } = useUrlState(["status", "q", "page"] as const);
  const [view, setView] = useViewMode("users");
  const status = values.status || "ALL";
  const page = Math.max(0, Number(values.page) || 0);
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [codeFor, setCodeFor] = useState<ManagedUser | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const users = useQuery({
    queryKey: ["users", "list", status, values.q, page],
    queryFn: () => usersApi.list({ status: status === "ALL" ? undefined : status, query: values.q || undefined, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const counts = { ALL: useAdminCount().data, ACTIVE: useAdminCount("ACTIVE").data, PENDING: useAdminCount("PENDING").data, DISABLED: useAdminCount("DISABLED").data };

  const invalidate = [["users"]] as const;
  const activate = useAction((u: ManagedUser) => usersApi.activate(u.id), { success: (u) => `${u.firstName} re-enabled`, invalidate });
  const deactivate = useAction((u: ManagedUser) => usersApi.deactivate(u.id), { success: (u) => `${u.firstName} disabled`, invalidate });
  const reset = useAction((u: ManagedUser) => usersApi.resetPassword(u.id), { success: "Password reset - share the new sign-in code", invalidate });
  const remove = useAction((u: ManagedUser) => usersApi.remove(u.id), { success: "Admin deleted", invalidate });

  const rowActions = (u: ManagedUser) => (
    <RowActions
      user={u}
      onAction={(a) => {
        if (a === "permissions") setEditing(u);
        else if (a === "code") setCodeFor(u);
        else if (a === "activate") activate.mutate(u);
        else setConfirm({ kind: a, user: u });
      }}
    />
  );

  const columns: Column<ManagedUser>[] = [
    {
      key: "name",
      header: "Admin",
      cell: (u) => (
        <div className="flex min-w-[14rem] items-center gap-3">
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 text-xs font-semibold text-white shadow-sm">
            {initials(u.firstName, u.lastName)}
            {u.permissions.includes("FULL_ACCESS") && (
              <Crown className="absolute -right-1 -top-1 size-4 rounded-full bg-card p-0.5 text-secondary-500 shadow" aria-label="Super admin" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{u.firstName} {u.lastName}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email} · @{u.username}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Access", hideBelow: "md", cell: (u) => <span className="text-xs">{roleLabel(u.permissions)}</span> },
    { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} label={u.status === "PENDING" ? "Invited" : undefined} /> },
    { key: "login", header: "Last sign-in", hideBelow: "lg", cell: (u) => <span className="whitespace-nowrap text-xs text-muted-foreground">{u.lastLoginTime ? timeAgo(u.lastLoginTime) : "Never"}</span> },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (u) => rowActions(u),
    },
  ];

  const data = users.data;
  const c = confirm;
  return (
    <>
      <PageHeader
        title="Admin Team"
        description="Who can access this dashboard and what they can do. Every change is recorded in the audit log."
        actions={<Can area="adminUsers" action="manage"><Button onClick={() => setCreating(true)}><UserPlus className="size-4" /> Add admin</Button></Can>}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v, page: "" })}
          segments={[
            { value: "ALL", label: "All", count: counts.ALL },
            { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
            { value: "PENDING", label: "Invited", count: counts.PENDING },
            { value: "DISABLED", label: "Disabled", count: counts.DISABLED },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q, page: "" })} placeholder="Search name, email or username…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={columns}
        renderCard={(u) => (
          <AdminCard
            user={u}
            actions={rowActions(u)}
            onOpen={viewerCanRead("auditLogs") ? () => router.push(`/audit-logs?userId=${u.id}`) : undefined}
          />
        )}
        rows={data?.content ?? []}
        getKey={(u) => u.id}
        onRowClick={viewerCanRead("auditLogs") ? (u) => router.push(`/audit-logs?userId=${u.id}`) : undefined}
        loading={users.isLoading}
        error={users.isError}
        onRetry={() => users.refetch()}
        fetching={users.isFetching}
        empty={{ title: "No admins match", description: "Try another filter or search." }}
      />
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="mr-2 text-muted-foreground">Page {data.page + 1} of {data.totalPages}</span>
          <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 0} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Next page" disabled={page + 1 >= data.totalPages} onClick={() => update({ page: String(page + 1) })}><ChevronRight className="size-4" /></Button>
        </div>
      )}

      <CreateUserDialog
        open={creating}
        onOpenChange={(o) => { setCreating(o); if (!o && params.get("new")) router.replace("/users"); }}
        onCreated={(u) => setCodeFor(u)}
      />
      <PermissionEditor user={editing} onClose={() => setEditing(null)} />
      <OneTimeCodeDialog user={codeFor} onClose={() => setCodeFor(null)} />
      <ConfirmDialog
        open={!!c}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          c?.kind === "delete" ? `Delete ${c.user.firstName}?` : c?.kind === "reset" ? `Reset ${c?.user.firstName}'s password?` : `Disable ${c?.user.firstName}?`
        }
        description={
          c?.kind === "delete" ? "They lose access immediately. Their past actions stay in the audit log."
            : c?.kind === "reset" ? "Their current password stops working. They'll sign in with a new one-time code and choose a new password."
              : "They're signed out and can't sign in until re-enabled."
        }
        confirmLabel={c?.kind === "delete" ? "Delete admin" : c?.kind === "reset" ? "Reset password" : "Disable"}
        destructive={c?.kind !== "reset"}
        pending={remove.isPending || deactivate.isPending || reset.isPending}
        onConfirm={() => {
          if (!c) return;
          const done = { onSuccess: () => setConfirm(null) };
          if (c.kind === "delete") remove.mutate(c.user, done);
          else if (c.kind === "deactivate") deactivate.mutate(c.user, done);
          else reset.mutate(c.user, { onSuccess: () => { setConfirm(null); setCodeFor(c.user); } });
        }}
      />
    </>
  );
}

export default function UsersPage() {
  return (
    <RequireArea area="adminUsers" label="the Admin Team">
      <Suspense>
        <Team />
      </Suspense>
    </RequireArea>
  );
}
