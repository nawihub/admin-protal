"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AREA_QUERY_KEYS, describeJob, useBatchJobs } from "@/lib/queries/batch-jobs";
import { useSeenJobs } from "@/lib/hooks/use-seen-jobs";
import type { BatchJob } from "@/lib/api/types";

/**
 * Alerts the admin the moment a background batch deletion finishes - wherever they are in the
 * dashboard - and refreshes the lists it touched. Jobs that finished before this page loaded
 * aren't toasted; they show as unread in the notifications bell instead.
 */
export function BatchJobWatcher() {
  const queryClient = useQueryClient();
  const { data: jobs } = useBatchJobs();
  const { hasBaseline, markSeen } = useSeenJobs();
  const previous = useRef<Map<string, BatchJob["status"]> | null>(null);
  const mountedAt = useRef<number | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!jobs) return;
    // First visit on this browser: treat what's already finished as seen, so the bell doesn't
    // open with a backlog of old jobs.
    if (!hasBaseline) markSeen(jobs.filter((j) => j.status === "COMPLETED").map((j) => j.id));

    const before = previous.current;
    if (before) {
      for (const job of jobs) {
        const was = before.get(job.id);
        // Finished since the last poll - including a job started and finished between two polls.
        const justFinished = job.status === "COMPLETED" &&
          (was ? was !== "COMPLETED" : new Date(job.createTime).getTime() >= (mountedAt.current ?? Infinity));
        if (!justFinished) continue;
        const notify = job.failed ? toast.warning : toast.success;
        notify(describeJob(job), {
          description: job.failed ? "Open the notifications bell to see what couldn't be deleted." : "The background deletion has finished.",
        });
        queryClient.invalidateQueries({ queryKey: [AREA_QUERY_KEYS[job.area]] });
        queryClient.invalidateQueries({ queryKey: ["counts"] });
        queryClient.invalidateQueries({ queryKey: ["attention"] });
      }
    }
    previous.current = new Map(jobs.map((j) => [j.id, j.status]));
  }, [jobs, hasBaseline, markSeen, queryClient]);

  return null;
}
