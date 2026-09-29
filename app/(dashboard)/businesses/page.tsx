"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { ViewToggle } from "@/components/data/view-toggle";
import { BusinessCard } from "@/components/cards/business-card";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { businessesApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useBusinessCount } from "@/lib/queries/counts";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { formatEnumLabel } from "@/lib/utils";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Business } from "@/lib/api/types";

const COLUMNS: Column<Business>[] = [
  {
    key: "name",
    header: "Business",
    cell: (b) => (
      <div className="flex min-w-[16rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 font-display text-xs font-semibold text-white shadow-sm">
          {initialsOf(b.businessName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{b.businessName}</p>
          <p className="truncate text-xs text-muted-foreground">{b.ownerName}</p>
        </div>
      </div>
    ),
  },
  { key: "tracking", header: "Tracking ID", hideBelow: "md", cell: (b) => <span className="font-mono text-xs text-muted-foreground">#{b.trackingId}</span> },
  {
    key: "category",
    header: "Category",
    hideBelow: "lg",
    cell: (b) => <Tag>{b.businessCategory === "OTHER" && b.otherCategory ? b.otherCategory : formatEnumLabel(b.businessCategory)}</Tag>,
  },
  { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  { key: "submitted", header: "Submitted", hideBelow: "sm", cell: (b) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(b.createTime)}</span> },
];

const STATUSES = ["PENDING", "IN_REVIEW", "PAYMENT_PENDING", "PROCESSING", "APPROVED", "REJECTED"] as const;
const LABELS: Record<(typeof STATUSES)[number], string> = {
  PENDING: "Pending", IN_REVIEW: "In review", PAYMENT_PENDING: "Payment due", PROCESSING: "Processing", APPROVED: "Registered", REJECTED: "Rejected",
};

function BusinessesList() {
  const router = useRouter();
  const { values, update } = useUrlState(["status", "q"] as const);
  const [view, setView] = useViewMode("businesses");
  const status = values.status || "PENDING";
  const list = useCursorList(["businesses", "list", status, values.q], (pageToken) =>
    businessesApi.list({ pageSize: 20, pageToken, status: status === "ALL" ? undefined : status, query: values.q || undefined }),
  );
  const counts: Record<string, number | undefined> = {
    PENDING: useBusinessCount("PENDING").data,
    IN_REVIEW: useBusinessCount("IN_REVIEW").data,
    PAYMENT_PENDING: useBusinessCount("PAYMENT_PENDING").data,
    PROCESSING: useBusinessCount("PROCESSING").data,
    APPROVED: useBusinessCount("APPROVED").data,
    REJECTED: useBusinessCount("REJECTED").data,
  };

  return (
    <>
      <PageHeader title="Businesses" description="Business registrations move from review, through the registration fee, to a registration number." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v })}
          segments={[...STATUSES.map((s) => ({ value: s, label: LABELS[s], count: counts[s] })), { value: "ALL", label: "All" }]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search name, owner or tracking ID…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={COLUMNS}
        renderCard={(b) => <BusinessCard business={b} />}
        rows={list.items}
        getKey={(b) => b.id}
        onRowClick={(b) => router.push(`/businesses/${b.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No registrations here", description: "Try another status or search." }}
      />
    </>
  );
}

export default function BusinessesPage() {
  return (
    <RequireArea area="businesses" label="Businesses">
      <Suspense>
        <BusinessesList />
      </Suspense>
    </RequireArea>
  );
}
