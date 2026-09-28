"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Folder as FolderIcon, FolderPlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireArea } from "@/components/auth/require-area";
import { Can } from "@/components/auth/can";
import { PageHeader } from "@/components/data/page-header";
import { SearchInput } from "@/components/data/filters";
import { ConfirmDialog } from "@/components/data/action-dialogs";
import { resourcesApi } from "@/lib/api/admin";
import { useAction } from "@/lib/hooks/use-action";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { formatFileSize } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { Folder } from "@/lib/api/types";

function NewFolderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const create = useAction((n: string) => resourcesApi.createFolder(n), { success: "Folder created", invalidate: [["resources"]] });
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setName(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>Folders group related resources, e.g. &ldquo;Tax &amp; compliance&rdquo;.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(name.trim(), { onSuccess: () => { onOpenChange(false); setName(""); } }); }}>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" maxLength={80} />
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />} Create folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FolderCard({ folder, index, onDelete }: { folder: Folder; index: number; onDelete: (f: Folder) => void }) {
  return (
    <div className="card-interactive stat-card stagger-in group relative rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ "--stagger": index % 12 } as React.CSSProperties}>
      <div className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400/20 to-secondary-400/20 text-primary-600 transition-transform duration-slow ease-spring group-hover:-rotate-6 group-hover:scale-110 dark:text-primary-300">
          <FolderIcon className="size-6" />
        </span>
        <Can area="resources" action="manage">
          {folder.totalFiles === 0 && (
            <Button
              variant="ghost" size="icon" aria-label={`Delete ${folder.name}`}
              className="relative z-[2] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onDelete(folder)}
            >
              <Trash2 className="size-4 text-error" />
            </Button>
          )}
        </Can>
      </div>
      <Link href={`/resources/${folder.id}`} className="mt-4 block truncate font-display text-lg font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']">
        {folder.name}
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        {folder.totalFiles} {folder.totalFiles === 1 ? "file" : "files"} · {formatFileSize(folder.byteSize)}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">Updated {timeAgo(folder.updateTime)}</p>
    </div>
  );
}

function Folders() {
  const { values, update } = useUrlState(["q"] as const);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const folders = useInfiniteQuery({
    queryKey: ["resources", "folders", values.q],
    queryFn: ({ pageParam }) => resourcesApi.folders({ pageSize: 24, pageToken: pageParam, query: values.q || undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNextPage ? last.nextPageToken ?? undefined : undefined),
  });
  const remove = useAction((id: string) => resourcesApi.deleteFolder(id), { success: "Folder deleted", invalidate: [["resources"]] });
  const items = folders.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="Resources"
        description="The resource library entrepreneurs learn from. Uploads are reviewed before they're visible."
        actions={
          <Can area="resources" action="manage">
            <Button onClick={() => setCreating(true)}><FolderPlus className="size-4" /> New folder</Button>
          </Can>
        }
      />
      <div className="mb-5"><SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search folders…" /></div>

      {folders.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="float-slow flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><FolderIcon className="size-7" /></span>
          <p className="mt-2 font-display font-semibold">{values.q ? "No folders match" : "No folders yet"}</p>
          <p className="text-sm text-muted-foreground">Create a folder to start uploading resources.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((f, i) => <FolderCard key={f.id} folder={f} index={i} onDelete={setDeleting} />)}
        </div>
      )}
      {folders.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => folders.fetchNextPage()} disabled={folders.isFetchingNextPage}>
            {folders.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />} Load more
          </Button>
        </div>
      )}

      <NewFolderDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="Only empty folders can be deleted."
        confirmLabel="Delete folder"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

export default function ResourcesPage() {
  return (
    <RequireArea area="resources" label="Resources">
      <Suspense>
        <Folders />
      </Suspense>
    </RequireArea>
  );
}
