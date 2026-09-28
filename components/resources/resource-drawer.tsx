"use client";

import { useState } from "react";
import { BookmarkIcon, CheckCircle2, Download, Eye, FileText, Loader2, Star, Trash2, Video, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog, ReasonDialog } from "@/components/data/action-dialogs";
import { ProtectedImage } from "@/components/data/protected-image";
import { resourcesApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useDownload } from "@/lib/hooks/use-download";
import { formatEnumLabel, formatFileSize } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Resource } from "@/lib/api/types";

export function ResourceIcon({ resource, className }: { resource: Pick<Resource, "type">; className?: string }) {
  const Icon = resource.type === "VIDEO" ? Video : FileText;
  return <Icon className={className} />;
}

/** Slide-over with a resource's details and its moderation actions. */
export function ResourceDrawer({ resource, onClose }: { resource: Resource | null; onClose: () => void }) {
  const { canManage } = usePermissions();
  const manage = canManage("resources");
  const [featured, setFeatured] = useState(false);
  const [dialog, setDialog] = useState<"reject" | "delete" | null>(null);
  const { busy, download } = useDownload();

  const invalidate = [["resources"]] as const;
  const approve = useAction((id: string) => resourcesApi.approve(id, featured), { success: "Resource approved", invalidate });
  const reject = useAction((a: { id: string; reason: string }) => resourcesApi.reject(a.id, a.reason), { success: "Resource rejected", invalidate });
  const remove = useAction((id: string) => resourcesApi.remove(id), { success: "Resource deleted", invalidate });

  const r = resource;
  return (
    <>
      <Dialog open={!!r} onOpenChange={(o) => { if (!o) { onClose(); setFeatured(false); } }}>
        <DialogContent className="left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-md translate-x-0 translate-y-0 animate-slide-in-right rounded-none rounded-l-2xl p-0">
          {r && (
            <div className="flex h-full flex-col">
              <div className="relative aspect-video shrink-0 overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-400">
                <div className="tile-pattern absolute inset-0 flex items-center justify-center">
                  <ResourceIcon resource={r} className="size-14 text-white/80" />
                </div>
                {r.thumbnailUrl && (
                  <ProtectedImage queryKey={["resources", "thumb", r.id]} fetcher={() => resourcesApi.thumbnail(r.id)} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={r.status} />
                    <Tag>{r.format === "NOT_APPLICABLE" ? "Video" : formatEnumLabel(r.format)}</Tag>
                    <Tag tone={r.accessLevel === "PRIVATE" ? "neutral" : r.accessLevel === "PREMIUM" ? "warning" : "brand"}>{formatEnumLabel(r.accessLevel)}</Tag>
                    {r.featured && <Tag tone="warning"><Star className="mr-1 size-3" />Featured</Tag>}
                  </div>
                  <DialogTitle className="mt-2 font-display text-xl">{r.title}</DialogTitle>
                  <DialogDescription className="mt-1 whitespace-pre-line">{r.description}</DialogDescription>
                </div>

                {r.status === "REJECTED" && r.rejectionReason && (
                  <div className="rounded-xl border border-error/25 bg-error/5 p-3 text-sm"><span className="font-medium text-error">Rejected: </span>{r.rejectionReason}</div>
                )}

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">File</dt><dd className="truncate" title={r.fileName}>{r.fileName}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Size</dt><dd>{formatFileSize(r.fileSize)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Uploaded</dt><dd>{formatDate(r.createTime)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Engagement</dt>
                    <dd className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-secondary-400 text-secondary-400" />{r.averageRating ? r.averageRating.toFixed(1) : "–"} <span className="text-muted-foreground">({r.ratingCount})</span></span>
                      <span className="inline-flex items-center gap-1"><BookmarkIcon className="size-3.5" />{r.bookmarkCount}</span>
                    </dd>
                  </div>
                </dl>

                {r.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{r.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => download("open", () => resourcesApi.download(r.id), r.fileName, "open")}>
                    {busy === "open" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} Preview
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => download("save", () => resourcesApi.download(r.id), r.fileName)}>
                    {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download
                  </Button>
                </div>

                {manage && r.status === "PENDING" && (
                  <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Review</p>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={featured} onCheckedChange={(c) => setFeatured(c === true)} /> Feature it on approval
                    </label>
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={approve.isPending} onClick={() => approve.mutate(r.id, { onSuccess: onClose })}>
                        {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Approve
                      </Button>
                      <Button variant="outline" className="flex-1 border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("reject")}>
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {manage && (
                <div className="border-t border-border p-4">
                  <Button variant="ghost" className="w-full text-error hover:bg-error/10" onClick={() => setDialog("delete")}>
                    <Trash2 className="size-4" /> Delete resource
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={dialog === "reject"}
        onOpenChange={(o) => setDialog(o ? "reject" : null)}
        title="Reject this resource"
        description="Recorded with the resource so the uploader knows what to fix."
        confirmLabel="Reject"
        pending={reject.isPending}
        onSubmit={(reason) => r && reject.mutate({ id: r.id, reason }, { onSuccess: () => { setDialog(null); onClose(); } })}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title="Delete this resource?"
        description="The file, its thumbnail, ratings and bookmarks are permanently removed."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => r && remove.mutate(r.id, { onSuccess: () => { setDialog(null); onClose(); } })}
      />
    </>
  );
}
