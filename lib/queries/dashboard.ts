"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { auditApi, businessesApi, ideasApi, opportunitiesApi } from "@/lib/api/admin";
import { countKeys } from "@/lib/queries/counts";

export const PIPELINES = {
  ideas: { label: "Big Ideas", statuses: ["PUBLISHED", "IN_REVIEW", "APPROVED", "DECLINED"], fetch: (s: string) => ideasApi.list({ pageSize: 1, status: s }) },
  opportunities: { label: "Opportunities", statuses: ["PENDING", "IN_REVIEW", "APPROVED", "DECLINED"], fetch: (s: string) => opportunitiesApi.list({ pageSize: 1, status: s }) },
  businesses: { label: "Businesses", statuses: ["PENDING", "IN_REVIEW", "PAYMENT_PENDING", "APPROVED", "REJECTED"], fetch: (s: string) => businessesApi.list({ pageSize: 1, status: s }) },
} as const;

export type PipelineKey = keyof typeof PIPELINES;

/** Status breakdown per area (only the areas the admin can read). */
export function usePipelineCounts(areas: PipelineKey[]) {
  const pairs = areas.flatMap((area) => PIPELINES[area].statuses.map((status) => ({ area, status })));
  const results = useQueries({
    queries: pairs.map(({ area, status }) => ({
      queryKey: countKeys.of(area, status),
      queryFn: async () => (await PIPELINES[area].fetch(status)).totalCount,
      staleTime: 30_000,
      refetchInterval: 60_000,
    })),
  });
  const counts: Record<string, Record<string, number | undefined>> = {};
  pairs.forEach(({ area, status }, i) => {
    counts[area] ??= {};
    counts[area][status] = results[i].data;
  });
  return { counts, loading: results.some((r) => r.isLoading) };
}

/** The newest items waiting on a decision, per area. */
export function useAttentionQueue(enabled: { ideas: boolean; opportunities: boolean; businesses: boolean }) {
  const ideas = useQuery({
    queryKey: ["attention", "ideas"],
    queryFn: () => ideasApi.list({ pageSize: 5, status: "PUBLISHED" }),
    enabled: enabled.ideas,
  });
  const opportunities = useQuery({
    queryKey: ["attention", "opportunities"],
    queryFn: () => opportunitiesApi.list({ pageSize: 5, status: "PENDING" }),
    enabled: enabled.opportunities,
  });
  const businesses = useQuery({
    queryKey: ["attention", "businesses"],
    queryFn: () => businessesApi.list({ pageSize: 5, status: "PENDING" }),
    enabled: enabled.businesses,
  });
  return { ideas, opportunities, businesses };
}

export function useCategoryAnalysis(enabled: boolean) {
  return useQuery({ queryKey: ["opportunity-analysis"], queryFn: opportunitiesApi.analysis, enabled, staleTime: 60_000 });
}

export function useRecentActivity(enabled: boolean) {
  return useQuery({ queryKey: ["audit", "recent"], queryFn: () => auditApi.list({ size: 6 }), enabled, refetchInterval: 60_000 });
}
