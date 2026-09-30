"use client";

import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ListSelection } from "@/components/data/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** The card counterpart of DataTable: same loading, empty, error and load-more states. */
export function CardGrid<T>({
  rows, getKey, renderCard, loading, error, onRetry, fetching, hasMore, loadingMore, onLoadMore, selection,
  empty = { title: "Nothing here yet", description: "Items will show up here as they arrive." },
}: {
  rows: T[];
  getKey: (row: T) => string;
  renderCard: (row: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  fetching?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  selection?: ListSelection;
  empty?: { title: string; description?: string };
}) {
  const selecting = !!selection && rows.some((r) => selection.selected.has(getKey(r)));
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
            <Skeleton className="h-28 rounded-none" style={{ animationDelay: `${i * 70}ms` }} />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-4 h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-14 text-center">
        <AlertTriangle className="size-8 text-error" />
        <p className="font-medium">Couldn&apos;t load this list</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="float-slow flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" /></span>
        <p className="mt-2 font-display font-semibold">{empty.title}</p>
        {empty.description && <p className="max-w-sm text-sm text-muted-foreground">{empty.description}</p>}
      </div>
    );
  }
  return (
    <>
      <div className={cn("grid gap-4 transition-opacity duration-normal sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4", fetching && "opacity-60")}>
        {rows.map((row, i) => (
          // The stagger lives on this wrapper: an animation's fill would otherwise pin the tile's transform.
          <div key={getKey(row)} className="stagger-in group/select relative" style={{ "--stagger": i % 12 } as React.CSSProperties}>
            <div className={cn("h-full rounded-2xl transition-shadow duration-normal", selection?.selected.has(getKey(row)) && "ring-2 ring-primary-500 ring-offset-2 ring-offset-background")}>
              {renderCard(row, i)}
            </div>
            {selection && (
              // Floats just outside the card's corner so it never covers the cover's chips.
              <span
                className={cn(
                  "absolute -left-2 -top-2 z-[3] flex size-7 items-center justify-center rounded-full bg-card shadow-md ring-1 ring-border transition-all duration-normal ease-spring",
                  selecting || selection.selected.has(getKey(row))
                    ? "scale-100 opacity-100"
                    : "scale-75 opacity-0 group-hover/select:scale-100 group-hover/select:opacity-100 group-focus-within/select:scale-100 group-focus-within/select:opacity-100",
                )}
              >
                <Checkbox
                  checked={selection.selected.has(getKey(row))}
                  onCheckedChange={() => selection.onToggle(getKey(row))}
                  aria-label="Select"
                />
              </span>
            )}
          </div>
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="size-4 animate-spin" />} Load more
          </Button>
        </div>
      )}
    </>
  );
}
