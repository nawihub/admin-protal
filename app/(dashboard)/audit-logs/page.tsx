"use client";

import { Suspense } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Ban, CheckCircle2, ChevronLeft, ChevronRight, CirclePlus, ClipboardList, LogIn, Pencil, PlayCircle, Trash2, X, XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { SearchInput } from "@/components/data/filters";
import { Tag } from "@/components/data/status-badge";
import { auditApi } from "@/lib/api/admin";
import { useAdminNames } from "@/lib/queries/admin-names";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { cn, formatEnumLabel } from "@/lib/utils";
import type { AuditLog } from "@/lib/api/types";

const PAGE_SIZE = 30;

const ACTIONS: Record<string, { icon: LucideIcon; tone: string }> = {
  CREATE: { icon: CirclePlus, tone: "bg-primary-500/15 text-primary-600 dark:text-primary-300" },
  UPDATE: { icon: Pencil, tone: "bg-info/15 text-info" },
  DELETE: { icon: Trash2, tone: "bg-error/15 text-error" },
  APPROVE: { icon: CheckCircle2, tone: "bg-success/15 text-success" },
  REJECT: { icon: XCircle, tone: "bg-error/15 text-error" },
  LOGIN: { icon: LogIn, tone: "bg-muted text-muted-foreground" },
  ACTIVATE: { icon: PlayCircle, tone: "bg-success/15 text-success" },
  DEACTIVATE: { icon: Ban, tone: "bg-warning/15 text-[hsl(38_92%_38%)] dark:text-warning" },
  BLOCK: { icon: Ban, tone: "bg-error/15 text-error" },
};
const FILTER_ACTIONS = ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "LOGIN", "ACTIVATE", "DEACTIVATE"];

function dayLabel(iso: string | null) {
  if (!iso) return "Undated";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function groupByDay(logs: AuditLog[]) {
  const groups: { day: string; logs: AuditLog[] }[] = [];
  for (const log of logs) {
    const day = dayLabel(log.createTime);
    const last = groups.at(-1);
    if (last?.day === day) last.logs.push(log);
    else groups.push({ day, logs: [log] });
  }
  return groups;
}

function Entry({ log, nameOf, index }: { log: AuditLog; nameOf: (id: string) => string; index: number }) {
  const meta = ACTIONS[log.action] ?? { icon: ClipboardList, tone: "bg-muted text-muted-foreground" };
  const Icon = meta.icon;
  const actor = nameOf(log.userId);
  const target = log.resourceId && log.resourceId !== log.userId ? nameOf(log.resourceId) : null;
  const details = log.metadata ? Object.entries(log.metadata).filter(([, v]) => v !== null && v !== "") : [];
  return (
    <li className="stagger-in relative flex gap-4 pb-6 last:pb-0" style={{ "--stagger": index % 12 } as React.CSSProperties}>
      <span className="absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-px bg-border" aria-hidden />
      <span className={cn("relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-background", meta.tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <b className="font-semibold">{actor}</b>{" "}
            <span className="text-muted-foreground">{log.message ? log.message.charAt(0).toLowerCase() + log.message.slice(1) : formatEnumLabel(log.action).toLowerCase()}</span>
            {target && <> <span className="text-muted-foreground">·</span> <b className="font-medium">{target}</b></>}
          </p>
          {log.createTime && (
            <time className="font-mono text-[11px] text-muted-foreground" dateTime={log.createTime}>
              {new Date(log.createTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </time>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Tag>{formatEnumLabel(log.action)}</Tag>
          <Tag>{formatEnumLabel(log.resource)}</Tag>
          {details.map(([k, v]) => (
            <Tag key={k} className="max-w-full truncate font-mono">{k}: {String(v)}</Tag>
          ))}
        </div>
      </div>
    </li>
  );
}

function AuditTrail() {
  const { values, update } = useUrlState(["action", "q", "userId", "from", "to", "page"] as const);
  const page = Math.max(0, Number(values.page) || 0);
  const nameOf = useAdminNames();
  const logs = useQuery({
    queryKey: ["audit", "list", values, page],
    queryFn: () => auditApi.list({
      action: values.action || undefined,
      query: values.q || undefined,
      userId: values.userId || undefined,
      dateFrom: values.from ? new Date(values.from + "T00:00:00").toISOString() : undefined,
      dateTo: values.to ? new Date(values.to + "T23:59:59.999").toISOString() : undefined,
      page,
      size: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  });
  const data = logs.data;
  const filtered = !!(values.action || values.q || values.userId || values.from || values.to);

  return (
    <>
      <PageHeader title="Audit Log" description="A tamper-evident trail of everything admins do in this dashboard." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={values.q} onChange={(q) => update({ q, page: "" })} placeholder="Search messages…" className="max-w-xs" />
        <Select value={values.action || "ALL"} onValueChange={(v) => update({ action: v === "ALL" ? "" : v, page: "" })}>
          <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {FILTER_ACTIONS.map((a) => <SelectItem key={a} value={a}>{formatEnumLabel(a)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="From" className="h-10 w-40" value={values.from} max={values.to || undefined} onChange={(e) => update({ from: e.target.value, page: "" })} />
          <span className="text-muted-foreground">–</span>
          <Input type="date" aria-label="To" className="h-10 w-40" value={values.to} min={values.from || undefined} onChange={(e) => update({ to: e.target.value, page: "" })} />
        </div>
        {values.userId && (
          <span className="animate-scale-in inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1.5 text-sm text-primary-700 dark:text-primary-300">
            By {nameOf(values.userId)}
            <button type="button" aria-label="Clear admin filter" onClick={() => update({ userId: "", page: "" })}><X className="size-3.5" /></button>
          </span>
        )}
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => update({ action: "", q: "", userId: "", from: "", to: "", page: "" })}>Clear filters</Button>
        )}
      </div>

      {logs.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : logs.isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="size-8 text-error" />
          <p className="font-medium">Couldn&apos;t load the audit log</p>
          <Button variant="outline" size="sm" onClick={() => logs.refetch()}>Try again</Button>
        </div>
      ) : !data?.content.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="float-slow flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><ClipboardList className="size-6" /></span>
          <p className="mt-2 font-display font-semibold">No entries</p>
          <p className="text-sm text-muted-foreground">{filtered ? "Nothing matches these filters." : "Admin actions will appear here."}</p>
        </div>
      ) : (
        <div className={cn("space-y-8 transition-opacity", logs.isFetching && "opacity-60")}>
          {groupByDay(data.content).map((g) => (
            <section key={g.day}>
              <h2 className="sticky top-16 z-[2] mb-4 inline-block rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                {g.day}
              </h2>
              <ol>{g.logs.map((log, i) => <Entry key={log.id} log={log} nameOf={nameOf} index={i} />)}</ol>
            </section>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-end gap-2 text-sm">
          <span className="mr-2 text-muted-foreground">{data.totalElements.toLocaleString()} entries · page {data.page + 1} of {data.totalPages}</span>
          <Button variant="outline" size="icon" aria-label="Newer" disabled={page === 0} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Older" disabled={page + 1 >= data.totalPages} onClick={() => update({ page: String(page + 1) })}><ChevronRight className="size-4" /></Button>
        </div>
      )}
    </>
  );
}

export default function AuditLogsPage() {
  return (
    <RequireArea area="auditLogs" label="the Audit Log">
      <Suspense>
        <AuditTrail />
      </Suspense>
    </RequireArea>
  );
}
