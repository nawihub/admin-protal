"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge } from "@/components/data/status-badge";
import { Tile, TileLink, SegmentMeter } from "@/components/cards/tile";
import { ViewToggle } from "@/components/data/view-toggle";
import { competitionPhaseLabel } from "@/components/competitions/labels";
import { competitionsApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { formatDate } from "@/lib/format";
import type { Competition } from "@/lib/api/types";

const FILTERS: Record<string, string[] | undefined> = {
  ACTIVE: ["PUBLISHED", "SHORTLISTING", "PITCH_VIDEO", "FINALS"],
  DRAFT: ["DRAFT"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
  ALL: undefined,
};

function Stats({ c }: { c: Competition }) {
  return (
    <span className="whitespace-nowrap text-xs text-muted-foreground">
      {c.stats.submitted} applied · {c.stats.shortlisted} shortlisted · {c.stats.finalists} finalists
    </span>
  );
}

const COLUMNS: Column<Competition>[] = [
  {
    key: "title",
    header: "Competition",
    cell: (c) => (
      <div className="flex min-w-[16rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-primary-600 text-white shadow-sm">
          <Trophy className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{c.title}</p>
          {c.tagline && <p className="truncate text-xs text-muted-foreground">{c.tagline}</p>}
        </div>
      </div>
    ),
  },
  { key: "state", header: "Stage", cell: (c) => <StatusBadge status={c.state} label={competitionPhaseLabel(c)} /> },
  { key: "deadline", header: "Applications close", hideBelow: "md", cell: (c) => <span className="whitespace-nowrap text-sm">{formatDate(c.applicationClosesAt, true)}</span> },
  { key: "stats", header: "Entries", hideBelow: "lg", cell: (c) => <Stats c={c} /> },
];

function CompetitionCard({ c }: { c: Competition }) {
  return (
    <Tile>
      <TileLink href={`/competitions/${c.id}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-primary-600 text-white shadow-sm"><Trophy className="size-5" /></span>
          <StatusBadge status={c.state} label={competitionPhaseLabel(c)} />
        </div>
        <p className="mt-3 line-clamp-2 font-display font-semibold">{c.title}</p>
        {c.tagline && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.tagline}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Applications close {formatDate(c.applicationClosesAt)}</p>
        <div className="mt-3"><SegmentMeter value={c.stats.finalists} total={c.totalFinalists} label={`${c.stats.finalists}/${c.totalFinalists} finalists`} /></div>
        <div className="mt-2"><Stats c={c} /></div>
      </TileLink>
    </Tile>
  );
}

function CompetitionsList() {
  const router = useRouter();
  const { canManage } = usePermissions();
  const { values, update } = useUrlState(["filter", "q"] as const);
  const [view, setView] = useViewMode("competitions");
  const filter = values.filter || "ACTIVE";
  const list = useCursorList(["competitions", "list", filter, values.q], (pageToken) =>
    competitionsApi.list({ pageSize: 20, pageToken, state: FILTERS[filter], search: values.q || undefined }),
  );

  return (
    <>
      <PageHeader
        title="Competitions"
        description="Next Big Idea competitions: entrepreneurs enter a saved idea, and you take it through shortlisting, pitch videos and the live final to three winners."
        actions={canManage("bigIdeas") && (
          <Button asChild><Link href="/competitions/new"><Plus className="size-4" /> New competition</Link></Button>
        )}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={filter}
          onChange={(v) => update({ filter: v })}
          segments={[
            { value: "ACTIVE", label: "Running" },
            { value: "DRAFT", label: "Drafts" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "ALL", label: "All" },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search competitions…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={COLUMNS}
        renderCard={(c) => <CompetitionCard c={c} />}
        rows={list.items}
        getKey={(c) => c.id}
        onRowClick={(c) => router.push(`/competitions/${c.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No competitions here", description: filter === "ACTIVE" ? "Create one to open applications." : "Try another filter or search." }}
      />
    </>
  );
}

export default function CompetitionsPage() {
  return (
    <RequireArea area="bigIdeas" label="Competitions">
      <Suspense>
        <CompetitionsList />
      </Suspense>
    </RequireArea>
  );
}
