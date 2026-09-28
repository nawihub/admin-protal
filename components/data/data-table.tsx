"use client";

import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide below this breakpoint to keep small screens readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T>({
  columns,
  rows,
  getKey,
  onRowClick,
  loading,
  error,
  onRetry,
  fetching,
  hasMore,
  loadingMore,
  onLoadMore,
  empty = { title: "Nothing here yet", description: "Items will show up here as they arrive." },
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  /** Refetching with previous rows still shown - dims them. */
  fetching?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  empty?: { title: string; description?: string };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {columns.map((col) => (
                <th key={col.key} className={cn("whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", col.hideBelow && HIDE[col.hideBelow], col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("transition-opacity duration-normal", fetching && !loading && "opacity-60")}>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-4", col.hideBelow && HIDE[col.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-[12rem]" style={{ animationDelay: `${i * 80}ms` }} />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((row, i) => (
                <tr
                  key={getKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "stagger-in border-b border-border/60 transition-colors duration-fast last:border-0",
                    onRowClick && "cursor-pointer hover:bg-primary-500/[0.04] dark:hover:bg-primary-400/[0.06]",
                  )}
                  style={{ "--stagger": i % 12 } as React.CSSProperties}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3.5 align-middle", col.hideBelow && HIDE[col.hideBelow], col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="size-8 text-error" />
          <p className="font-medium">Couldn&apos;t load this list</p>
          {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="float-slow flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="mt-2 font-display font-semibold">{empty.title}</p>
          {empty.description && <p className="max-w-sm text-sm text-muted-foreground">{empty.description}</p>}
        </div>
      )}
      {hasMore && onLoadMore && (
        <div className="flex justify-center border-t border-border p-3">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="size-4 animate-spin" />} Load more
          </Button>
        </div>
      )}
    </div>
  );
}
