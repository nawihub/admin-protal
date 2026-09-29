"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { ViewToggle } from "@/components/data/view-toggle";
import { EntrepreneurCard } from "@/components/cards/entrepreneur-card";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge } from "@/components/data/status-badge";
import { entrepreneursApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useEntrepreneurCount } from "@/lib/queries/counts";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { ScoreRing } from "@/components/data/score-ring";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Entrepreneur } from "@/lib/api/types";

const COLUMNS: Column<Entrepreneur>[] = [
  {
    key: "name",
    header: "Entrepreneur",
    cell: (e) => (
      <div className="flex min-w-[14rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-600 text-xs font-semibold text-white shadow-sm">
          {initialsOf(`${e.firstName} ${e.lastName}`)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-medium">
            {e.firstName} {e.lastName}
            {e.vetted && <BadgeCheck className="size-4 shrink-0 text-primary-500" aria-label="Vetted" />}
            {e.featured && <Star className="size-3.5 shrink-0 fill-secondary-400 text-secondary-400" aria-label="Featured" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">{e.contactInfo?.email}</p>
        </div>
      </div>
    ),
  },
  { key: "district", header: "District", hideBelow: "md", cell: (e) => <span className="text-sm">{e.district}</span> },
  { key: "score", header: "Profile", hideBelow: "lg", cell: (e) => <ScoreRing score={e.profileScore} /> },
  { key: "status", header: "Status", cell: (e) => <StatusBadge status={e.status?.status ?? "PENDING"} /> },
  { key: "joined", header: "Joined", hideBelow: "sm", cell: (e) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(e.createTime)}</span> },
];

function EntrepreneursList() {
  const router = useRouter();
  const { values, update } = useUrlState(["status", "q"] as const);
  const [view, setView] = useViewMode("entrepreneurs");
  const status = values.status || "ALL";
  const filter = status === "VETTED" ? { vetted: true } : status === "ALL" ? {} : { status };
  const list = useCursorList(["entrepreneurs", "list", status, values.q], (pageToken) =>
    entrepreneursApi.list({ pageSize: 20, pageToken, ...filter, query: values.q || undefined }),
  );
  const counts = {
    PENDING: useEntrepreneurCount({ status: "PENDING" }).data,
    ACTIVE: useEntrepreneurCount({ status: "ACTIVE" }).data,
    SUSPENDED: useEntrepreneurCount({ status: "SUSPENDED" }).data,
    VETTED: useEntrepreneurCount({ vetted: true }).data,
    ALL: useEntrepreneurCount().data,
  };

  return (
    <>
      <PageHeader title="Entrepreneurs" description="Founder profiles on NaWeHub. Vetted and featured entrepreneurs get more visibility across the network." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v })}
          segments={[
            { value: "ALL", label: "All", count: counts.ALL },
            { value: "PENDING", label: "Pending", count: counts.PENDING },
            { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
            { value: "VETTED", label: "Vetted", count: counts.VETTED },
            { value: "SUSPENDED", label: "Suspended", count: counts.SUSPENDED },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search entrepreneurs…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={COLUMNS}
        renderCard={(e) => <EntrepreneurCard entrepreneur={e} />}
        rows={list.items}
        getKey={(e) => e.id}
        onRowClick={(e) => router.push(`/entrepreneurs/${e.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No entrepreneurs here", description: "Try another filter or search." }}
      />
    </>
  );
}

export default function EntrepreneursPage() {
  return (
    <RequireArea area="entrepreneurs" label="Entrepreneurs">
      <Suspense>
        <EntrepreneursList />
      </Suspense>
    </RequireArea>
  );
}
