"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/data/action-dialogs";
import { ApiError } from "@/lib/api/http";
import { batchJobKeys, noun } from "@/lib/queries/batch-jobs";
import type { BatchJob, BatchJobArea } from "@/lib/api/types";

/**
 * Floating bar for the current selection. Deleting starts a background job and returns at once;
 * the notifications watcher alerts the admin when it finishes.
 */
export function BatchActionBar({ area, selectedIds, onClear, onDelete }: {
  area: BatchJobArea;
  /** Only IDs still in the list - so the count matches what the admin can see. */
  selectedIds: string[];
  onClear: () => void;
  onDelete: (ids: string[]) => Promise<BatchJob>;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const count = selectedIds.length;
  const label = `${count} ${noun(area, count)}`;

  async function remove() {
    setPending(true);
    try {
      await onDelete(selectedIds);
      toast(`Deleting ${label} in the background`, { description: "You'll be notified here when it's done." });
      // Poll fast until this job completes, so the alert is prompt.
      await queryClient.invalidateQueries({ queryKey: batchJobKeys.recent });
      onClear();
      setConfirming(false);
    } catch (err) {
      toast.error(err instanceof ApiError && err.status === 403 ? "You don't have permission to do that." : err instanceof Error ? err.message : "Couldn't start the deletion");
    } finally {
      setPending(false);
    }
  }

  if (count === 0 && !confirming) return null;

  return (
    <>
      {count > 0 && (
        // Room at the bottom of the page so the last rows can scroll clear of the bar.
        <div aria-hidden className="h-24" />
      )}
      {count > 0 && createPortal(
        // Portalled to <body>: the page's entrance animation leaves a transform on the content,
        // which would otherwise pin this "fixed" bar to the bottom of the list, not the window.
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-sticky flex justify-center px-4">
          <div
            role="toolbar"
            aria-label="Selection actions"
            className="animate-fade-in-up pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-4 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)] ring-1 ring-black/5 dark:ring-white/10"
          >
            <span className="text-sm font-medium tabular-nums">{count} selected</span>
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="size-4" /> Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </div>,
        document.body,
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => !pending && setConfirming(open)}
        title={`Delete ${label}?`}
        description={`They're permanently deleted, with their files, in the background - you can keep working and you'll be notified when it's done. This can't be undone.`}
        confirmLabel={pending ? "Starting…" : `Delete ${label}`}
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}

