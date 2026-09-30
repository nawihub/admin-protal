"use client";

import { Bell, CheckCircle2, FolderOpen, HandCoins, Lightbulb, Loader2, TriangleAlert } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describeJob, useBatchJobs } from "@/lib/queries/batch-jobs";
import { useSeenJobs } from "@/lib/hooks/use-seen-jobs";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { BatchJob, BatchJobArea } from "@/lib/api/types";

const AREA_ICONS: Record<BatchJobArea, typeof Lightbulb> = {
  "big-ideas": Lightbulb,
  opportunities: HandCoins,
  resources: FolderOpen,
};

function JobRow({ job, unread }: { job: BatchJob; unread: boolean }) {
  const Icon = AREA_ICONS[job.area];
  const running = job.status !== "COMPLETED";
  const done = job.succeeded + job.failed;
  const failures = job.items.filter((i) => i.status === "FAILED");
  return (
    <li className={cn("relative rounded-xl px-3 py-2.5 transition-colors", unread && "bg-primary-500/[0.06]")}>
      {unread && <span className="absolute right-3 top-3 size-2 rounded-full bg-primary-500" aria-label="Unread" />}
      <div className="flex gap-3">
        <span className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          running ? "bg-info/10 text-info" : job.failed ? "bg-warning/15 text-[hsl(38_92%_38%)] dark:text-warning" : "bg-success/10 text-success",
        )}>
          {running ? <Loader2 className="size-4 animate-spin" /> : job.failed ? <TriangleAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
        </span>
        <div className="min-w-0 flex-1 pr-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icon className="size-3.5 shrink-0 text-muted-foreground" /> {describeJob(job)}
          </p>
          {running ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={done} aria-valuemax={job.total}>
              <div className="h-full rounded-full bg-info transition-[width] duration-slow ease-out" style={{ width: `${Math.max(4, (done / job.total) * 100)}%` }} />
            </div>
          ) : (
            failures.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {failures.slice(0, 3).map((f) => (
                  <li key={f.id} className="truncate" title={`${f.id}: ${f.errorMessage ?? f.errorCode}`}>
                    <span className="font-mono">{f.id}</span> · {f.errorCode === "NOT_FOUND" ? "already gone" : f.errorMessage ?? f.errorCode}
                  </li>
                ))}
                {failures.length > 3 && <li>…and {failures.length - 3} more</li>}
              </ul>
            )
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(job.completedTime ?? job.createTime)}</p>
        </div>
      </div>
    </li>
  );
}

/** Background job notifications - unread until the admin opens the bell. */
export function NotificationsBell() {
  const { data: jobs = [], enabled } = useBatchJobs();
  const { seen, markSeen } = useSeenJobs();
  if (!enabled) return null;

  const finished = jobs.filter((j) => j.status === "COMPLETED");
  const unread = finished.filter((j) => !seen.includes(j.id));
  const running = jobs.some((j) => j.status !== "COMPLETED");

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open && unread.length) markSeen(unread.map((j) => j.id)); }}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}>
          <Bell className={cn("size-5", unread.length > 0 && "animate-[wiggle_1s_ease-in-out_2]")} />
          {unread.length > 0 ? (
            <span className="animate-scale-in absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-card">
              {unread.length}
            </span>
          ) : running ? (
            <span className="live-dot absolute right-1.5 top-1.5 size-2 rounded-full bg-info" aria-hidden />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Background jobs</span>
          {running && <span className="flex items-center gap-1 text-xs font-normal text-info"><Loader2 className="size-3 animate-spin" /> Running</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {jobs.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No background jobs yet. Batch deletions show up here while they run and when they finish.</p>
        ) : (
          <ul className="max-h-96 space-y-1 overflow-y-auto">
            {jobs.map((job) => <JobRow key={job.id} job={job} unread={unread.includes(job)} />)}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
