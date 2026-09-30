"use client";

import { useQuery } from "@tanstack/react-query";
import { batchJobsApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import type { BatchJob, BatchJobArea } from "@/lib/api/types";

export const batchJobKeys = { recent: ["batch-jobs"] as const };

/**
 * The admin's recent background batch jobs. Polls every 2s while one is running so the completion
 * alert is prompt, every 10s otherwise (a job may be started from another tab), and again as soon
 * as the window regains focus.
 */
export function useBatchJobs() {
  const { canManage } = usePermissions();
  const enabled = canManage("bigIdeas") || canManage("opportunities") || canManage("resources");
  const query = useQuery({
    queryKey: batchJobKeys.recent,
    queryFn: () => batchJobsApi.recent(),
    enabled,
    refetchInterval: (q) => (q.state.data?.some((j) => j.status !== "COMPLETED") ? 2_000 : 10_000),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  return { ...query, enabled };
}

const NOUNS: Record<BatchJobArea, [string, string]> = {
  "big-ideas": ["idea", "ideas"],
  opportunities: ["opportunity", "opportunities"],
  resources: ["resource", "resources"],
};

export function noun(area: BatchJobArea, n: number) {
  return NOUNS[area][n === 1 ? 0 : 1];
}

/** "12 ideas deleted, 1 failed" / "Deleting 12 ideas…" */
export function describeJob(job: BatchJob) {
  if (job.status !== "COMPLETED") return `Deleting ${job.total} ${noun(job.area, job.total)}…`;
  const done = `${job.succeeded} ${noun(job.area, job.succeeded)} deleted`;
  return job.failed ? `${done}, ${job.failed} failed` : done;
}

/** Query keys whose data a finished deletion in this area makes stale. */
export const AREA_QUERY_KEYS: Record<BatchJobArea, string> = {
  "big-ideas": "ideas",
  opportunities: "opportunities",
  resources: "resources",
};
