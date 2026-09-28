"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPage } from "@/lib/api/types";

/**
 * Infinite cursor listing. The total comes from the first page (the only one where services
 * compute it), and previous results stay on screen - dimmed - while a new filter loads.
 */
export function useCursorList<T>(
  key: readonly unknown[],
  fetchPage: (pageToken: string | undefined) => Promise<CursorPage<T>>,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchPage(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNextPage ? last.nextPageToken ?? undefined : undefined),
    placeholderData: keepPreviousData,
    enabled,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.totalCount;
  return { ...query, items, total };
}
