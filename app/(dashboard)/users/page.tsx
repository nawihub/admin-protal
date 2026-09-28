"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Ban, ChevronLeft, ChevronRight, Crown, KeyRound, Lock, MoreHorizontal, PlayCircle, RotateCcw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RequireArea } from "@/components/auth/require-area";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/data/page-header";
import { DataTable, type Column } from "@/components/data/data-table";
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

function Team() {
  const router = useRouter();
  const params = useSearchParams();
  const { canRead } = usePermissions();
  const { values, update } = useUrlState(["status", "q", "page"] as const);
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
      cell: (u) => (
        <RowActions
          user={u}
          onAction={(a) => {
            if (a === "permissions") setEditing(u);
            else if (a === "code") setCodeFor(u);
            else if (a === "activate") activate.mutate(u);
            else setConfirm({ kind: a, user: u });
          }}
        />
      ),
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
        <SearchInput value={values.q} onChange={(q) => update({ q, page: "" })} placeholder="Search name, email or username…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        getKey={(u) => u.id}
        onRowClick={canRead("auditLogs") ? (u) => router.push(`/audit-logs?userId=${u.id}`) : undefined}
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
