"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Paperclip } from "lucide-react";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { BatchActionBar } from "@/components/data/batch-action-bar";
import { useSelection } from "@/lib/hooks/use-selection";
import { usePermissions } from "@/lib/auth/use-permissions";
import { ViewToggle } from "@/components/data/view-toggle";
import { IdeaCard } from "@/components/cards/idea-card";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ideasApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useIdeaCount } from "@/lib/queries/counts";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { formatEnumLabel } from "@/lib/utils";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Idea } from "@/lib/api/types";

const COLUMNS: Column<Idea>[] = [
  {
    key: "idea",
    header: "Idea",
    cell: (i) => (
      <div className="flex min-w-[16rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-300 to-primary-500 text-white shadow-sm">
          <Lightbulb className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{i.ideaName}</p>
          <p className="truncate text-xs text-muted-foreground">{i.oneLineDescription}</p>
        </div>
      </div>
    ),
  },
  {
    key: "applicant",
    header: "Applicant",
    hideBelow: "md",
    cell: (i) => (
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">{initialsOf(i.applicant.fullName)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm">{i.applicant.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{i.applicant.location}</p>
        </div>
      </div>
    ),
  },
  { key: "stage", header: "Stage", hideBelow: "lg", cell: (i) => <Tag>{formatEnumLabel(i.stage)}</Tag> },
  {
    key: "materials",
    header: "Files",
    hideBelow: "xl",
    cell: (i) => (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Paperclip className="size-3.5" /> {i.supportingMaterials.length}
      </span>
    ),
  },
  { key: "status", header: "Status", cell: (i) => <StatusBadge status={i.status} /> },
  { key: "submitted", header: "Submitted", hideBelow: "sm", cell: (i) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(i.createTime)}</span> },
];

function BigIdeasList() {
  const router = useRouter();
  const { values, update } = useUrlState(["status", "q"] as const);
  const [view, setView] = useViewMode("ideas");
  const status = values.status || "PUBLISHED";
  const list = useCursorList(["ideas", "list", status, values.q], (pageToken) =>
    ideasApi.list({ pageSize: 20, pageToken, status: status === "ALL" ? undefined : status, searchQuery: values.q || undefined }),
  );
  const { canManage } = usePermissions();
  const canDelete = canManage("bigIdeas");
  const selection = useSelection();
  const selectedIds = list.items.map((i) => i.id).filter((id) => selection.selected.has(id));
  const counts = {
    PUBLISHED: useIdeaCount("PUBLISHED").data,
    IN_REVIEW: useIdeaCount("IN_REVIEW").data,
    APPROVED: useIdeaCount("APPROVED").data,
    DECLINED: useIdeaCount("DECLINED").data,
  };

  return (
    <>
      <PageHeader title="Big Ideas" description="Pitches from founders across the network. Published ideas wait for your review; drafts stay private to their owners." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v })}
          segments={[
            { value: "PUBLISHED", label: "Awaiting review", count: counts.PUBLISHED },
            { value: "IN_REVIEW", label: "In review", count: counts.IN_REVIEW },
            { value: "APPROVED", label: "Approved", count: counts.APPROVED },
            { value: "DECLINED", label: "Declined", count: counts.DECLINED },
            { value: "ALL", label: "All" },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search ideas or applicants…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        selection={canDelete ? { selected: selection.selected, onToggle: selection.toggle, onToggleAll: selection.toggleAll } : undefined}
        view={view}
        columns={COLUMNS}
        renderCard={(i) => <IdeaCard idea={i} />}
        rows={list.items}
        getKey={(i) => i.id}
        onRowClick={(i) => router.push(`/big-ideas/${i.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No ideas here", description: status === "PUBLISHED" ? "Nothing is waiting for review - nice work." : "Try another status or search." }}
      />
      {canDelete && (
        <BatchActionBar area="big-ideas" selectedIds={selectedIds} onClear={selection.clear} onDelete={ideasApi.batchDelete} />
      )}
    </>
  );
}

export default function BigIdeasPage() {
  return (
    <RequireArea area="bigIdeas" label="Big Ideas">
      <Suspense>
        <BigIdeasList />
      </Suspense>
    </RequireArea>
  );
}
