"use client";

import { Suspense, use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireArea } from "@/components/auth/require-area";
import { Can } from "@/components/auth/can";
import { BackLink } from "@/components/data/detail";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { ViewToggle } from "@/components/data/view-toggle";
import { ResourceCard } from "@/components/cards/resource-card";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ResourceDrawer, ResourceIcon } from "@/components/resources/resource-drawer";
import { UploadDialog } from "@/components/resources/upload-dialog";
import { resourcesApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { formatEnumLabel, formatFileSize } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { Resource } from "@/lib/api/types";

const COLUMNS: Column<Resource>[] = [
  {
    key: "title",
    header: "Resource",
    cell: (r) => (
      <div className="flex min-w-[16rem] items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
          <ResourceIcon resource={r} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-medium">{r.title}{r.featured && <Star className="size-3.5 shrink-0 fill-secondary-400 text-secondary-400" />}</p>
          <p className="truncate text-xs text-muted-foreground">{r.fileName}</p>
        </div>
      </div>
    ),
  },
  { key: "format", header: "Format", hideBelow: "lg", cell: (r) => <Tag>{r.format === "NOT_APPLICABLE" ? "Video" : formatEnumLabel(r.format)}</Tag> },
  { key: "access", header: "Access", hideBelow: "md", cell: (r) => <span className="text-xs">{formatEnumLabel(r.accessLevel)}</span> },
  { key: "size", header: "Size", hideBelow: "xl", cell: (r) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatFileSize(r.fileSize)}</span> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "uploaded", header: "Uploaded", hideBelow: "sm", cell: (r) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(r.createTime)}</span> },
];

function FolderView({ folderId }: { folderId: string }) {
  const { values, update } = useUrlState(["status", "q"] as const);
  const [view, setView] = useViewMode("resources");
  const status = values.status || "ALL";
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const folder = useQuery({ queryKey: ["resources", "folder", folderId], queryFn: () => resourcesApi.folder(folderId) });
  const list = useCursorList(["resources", "list", folderId, status, values.q], (pageToken) =>
    resourcesApi.inFolder(folderId, { pageSize: 20, pageToken, status: status === "ALL" ? undefined : status, query: values.q || undefined }),
  );
  // Look the open resource up in the list so the drawer reflects moderation changes on refetch.
  const open = list.items.find((r) => r.id === openId) ?? null;

  return (
    <>
      <BackLink href="/resources" label="All folders" />
      <PageHeader
        eyebrow="Folder"
        title={folder.data?.name ?? "…"}
        description={folder.data ? `${folder.data.totalFiles} files · ${formatFileSize(folder.data.byteSize)}` : undefined}
        actions={
          <Can area="resources" action="manage">
            <Button onClick={() => setUploading(true)}><Upload className="size-4" /> Upload</Button>
          </Can>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segments
          value={status}
          onChange={(v) => update({ status: v })}
          segments={[
            { value: "ALL", label: "All", count: status === "ALL" ? list.total : undefined },
            { value: "PENDING", label: "Pending", count: status === "PENDING" ? list.total : undefined },
            { value: "APPROVED", label: "Approved", count: status === "APPROVED" ? list.total : undefined },
            { value: "REJECTED", label: "Rejected", count: status === "REJECTED" ? list.total : undefined },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search this folder…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={COLUMNS}
        renderCard={(r) => <ResourceCard resource={r} onOpen={() => setOpenId(r.id)} />}
        rows={list.items}
        getKey={(r) => r.id}
        onRowClick={(r) => setOpenId(r.id)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No resources here", description: "Upload a document or video to get started." }}
      />
      <ResourceDrawer resource={open} onClose={() => setOpenId(null)} />
      <UploadDialog folderId={folderId} open={uploading} onOpenChange={setUploading} />
    </>
  );
}

export default function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = use(params);
  return (
    <RequireArea area="resources" label="Resources">
      <Suspense>
        <FolderView folderId={folderId} />
      </Suspense>
    </RequireArea>
  );
}
