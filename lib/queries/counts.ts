"use client";

import { useQuery } from "@tanstack/react-query";
import { businessesApi, entrepreneursApi, ideasApi, opportunitiesApi, usersApi } from "@/lib/api/admin";

/**
 * Totals come from the first page of each listing (services compute a filtered total there),
 * fetched with pageSize 1 so they're cheap. Keys live under "counts" so any moderation action
 * can invalidate them all at once.
 */
export const countKeys = {
  all: ["counts"] as const,
  of: (area: string, filter: string) => ["counts", area, filter] as const,
};

const opts = { staleTime: 30_000, refetchInterval: 60_000 } as const;

export function useIdeaCount(status?: string, enabled = true) {
  return useQuery({
    queryKey: countKeys.of("ideas", status ?? "all"),
    queryFn: async () => (await ideasApi.list({ pageSize: 1, status })).totalCount,
    enabled,
    ...opts,
  });
}

export function useOpportunityCount(status?: string, enabled = true) {
  return useQuery({
    queryKey: countKeys.of("opportunities", status ?? "all"),
    queryFn: async () => (await opportunitiesApi.list({ pageSize: 1, status })).totalCount,
    enabled,
    ...opts,
  });
}

export function useBusinessCount(status?: string, enabled = true) {
  return useQuery({
    queryKey: countKeys.of("businesses", status ?? "all"),
    queryFn: async () => (await businessesApi.list({ pageSize: 1, status })).totalCount,
    enabled,
    ...opts,
  });
}

export function useEntrepreneurCount(filter: { status?: string; vetted?: boolean } = {}, enabled = true) {
  return useQuery({
    queryKey: countKeys.of("entrepreneurs", JSON.stringify(filter)),
    queryFn: async () => (await entrepreneursApi.list({ pageSize: 1, ...filter })).totalCount,
    enabled,
    ...opts,
  });
}

export function useAdminCount(status?: string, enabled = true) {
  return useQuery({
    queryKey: countKeys.of("admins", status ?? "all"),
    queryFn: async () => (await usersApi.list({ size: 1, status })).totalElements,
    enabled,
    ...opts,
  });
}
