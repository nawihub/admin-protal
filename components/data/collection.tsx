"use client";

import { DataTable, type Column, type ListSelection } from "@/components/data/data-table";
import { CardGrid } from "@/components/data/card-grid";
import type { ViewMode } from "@/lib/hooks/use-view-mode";

/** One list, shown as a table or as cards - both share loading, empty and paging behaviour. */
export function Collection<T>({ view, columns, onRowClick, renderCard, ...shared }: {
  view: ViewMode;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  renderCard: (row: T, index: number) => React.ReactNode;
  rows: T[];
  getKey: (row: T) => string;
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
  return (
    <div key={view} className="animate-fade-in-up">
      {view === "grid" ? <CardGrid renderCard={renderCard} {...shared} /> : <DataTable columns={columns} onRowClick={onRowClick} {...shared} />}
    </div>
  );
}
