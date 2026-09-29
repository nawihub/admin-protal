"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/lib/hooks/use-view-mode";

const OPTIONS: { value: ViewMode; label: string; icon: typeof Rows3 }[] = [
  { value: "table", label: "Table view", icon: Rows3 },
  { value: "grid", label: "Card view", icon: LayoutGrid },
];

/** Table / cards switch with a pill that slides between the two. */
export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Layout" className="relative flex h-10 shrink-0 items-center rounded-xl border border-border bg-muted/50 p-1">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-8 rounded-lg bg-card shadow-sm transition-transform duration-slow ease-spring"
        style={{ transform: value === "grid" ? "translateX(2rem)" : "none" }}
      />
      {OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <Tooltip key={v}>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="radio"
              aria-checked={value === v}
              aria-label={label}
              onClick={() => onChange(v)}
              className={cn(
                "relative z-[1] flex size-8 items-center justify-center rounded-lg transition-colors",
                value === v ? "text-primary-600 dark:text-primary-300" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 transition-transform duration-slow ease-spring", value === v && "scale-110")} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
