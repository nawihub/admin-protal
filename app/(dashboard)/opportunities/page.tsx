"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { DataTable, type Column } from "@/components/data/data-table";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { opportunitiesApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useOpportunityCount } from "@/lib/queries/counts";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { formatEnumLabel } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { Deadline } from "@/components/data/deadline";
import type { Opportunity } from "@/lib/api/types";

const COLUMNS: Column<Opportunity>[] = [
  {
    key: "title",
    header: "Opportunity",
    cell: (o) => (
      <div className="flex min-w-[16rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-white shadow-sm">
          <HandCoins className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{o.title}</p>
          <p className="truncate text-xs text-muted-foreground">{o.organizationName}</p>
        </div>
      </div>
    ),
  },
  {
    key: "categories",
    header: "Categories",
    hideBelow: "lg",
    cell: (o) => (
      <div className="flex flex-wrap gap-1">
        {o.categories.slice(0, 2).map((c) => <Tag key={c}>{c === "OTHER" && o.categoryOther ? o.categoryOther : formatEnumLabel(c)}</Tag>)}
        {o.categories.length > 2 && <Tag>+{o.categories.length - 2}</Tag>}
      </div>
    ),
  },
  { key: "deadline", header: "Deadline", hideBelow: "md", cell: (o) => <Deadline deadline={o.deadline} /> },
  { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  { key: "submitted", header: "Submitted", hideBelow: "sm", cell: (o) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(o.createTime)}</span> },
];

function OpportunitiesList() {
  const router = useRouter();
  const { values, update } = useUrlState(["status", "q"] as const);
  const status = values.status || "PENDING";
  const list = useCursorList(["opportunities", "list", status, values.q], (pageToken) =>
    opportunitiesApi.list({ pageSize: 20, pageToken, status: status === "ALL" ? undefined : status, searchQuery: values.q || undefined }),
  );
  const counts = {
    PENDING: useOpportunityCount("PENDING").data,
    IN_REVIEW: useOpportunityCount("IN_REVIEW").data,
    APPROVED: useOpportunityCount("APPROVED").data,
    DECLINED: useOpportunityCount("DECLINED").data,
  };

  return (
    <>
      <PageHeader title="Opportunities" description="Funding calls, programs and events submitted by partners. Only approved opportunities are shown publicly." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v })}
          segments={[
            { value: "PENDING", label: "Pending", count: counts.PENDING },
            { value: "IN_REVIEW", label: "In review", count: counts.IN_REVIEW },
            { value: "APPROVED", label: "Approved", count: counts.APPROVED },
            { value: "DECLINED", label: "Declined", count: counts.DECLINED },
            { value: "ALL", label: "All" },
          ]}
        />
        <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search opportunities…" />
      </div>
      <DataTable
        columns={COLUMNS}
        rows={list.items}
        getKey={(o) => o.id}
        onRowClick={(o) => router.push(`/opportunities/${o.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No opportunities here", description: status === "PENDING" ? "The queue is clear." : "Try another status or search." }}
      />
    </>
  );
}

export default function OpportunitiesPage() {
  return (
    <RequireArea area="opportunities" label="Opportunities">
      <Suspense>
        <OpportunitiesList />
      </Suspense>
    </RequireArea>
  );
}
