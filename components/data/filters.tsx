"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Debounced search input. */
export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [draft, setDraft] = useState(value);
  // Follow outside changes to the value (e.g. "clear filters" or back/forward navigation).
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  useEffect(() => {
    const t = setTimeout(() => draft !== value && onChange(draft), 300);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
      />
      {draft && (
        <button type="button" onClick={() => { setDraft(""); onChange(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Clear search">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export interface Segment {
  value: string;
  label: string;
  count?: number;
}

/** Status tabs with an animated active pill and optional live counts. */
export function Segments({ segments, value, onChange }: { segments: Segment[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1" role="tablist">
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-normal",
              active ? "animate-scale-in bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
            {s.count !== undefined && (
              <span className={cn("rounded-full px-1.5 font-mono text-[10px] tabular-nums", active ? "bg-primary-500/15 text-primary-700 dark:text-primary-300" : "bg-muted text-muted-foreground")}>
                {s.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
