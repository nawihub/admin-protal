import { Check } from "lucide-react";
import type { CompetitionState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STEPS: { state: CompetitionState; label: string }[] = [
  { state: "PUBLISHED", label: "Applications" },
  { state: "SHORTLISTING", label: "Shortlisting" },
  { state: "PITCH_VIDEO", label: "Pitch videos" },
  { state: "FINALS", label: "Live final" },
  { state: "COMPLETED", label: "Winners" },
];

/** Where a competition is in its journey. */
export function StageStepper({ state }: { state: CompetitionState }) {
  const current = state === "DRAFT" ? -1 : state === "CANCELLED" ? -2 : STEPS.findIndex((s) => s.state === state);
  return (
    <ol className={cn("flex w-full items-center gap-1 overflow-x-auto", state === "CANCELLED" && "opacity-50")} aria-label="Competition stages">
      {STEPS.map((step, i) => {
        const done = current > i || state === "COMPLETED";
        const active = current === i && state !== "COMPLETED";
        return (
          <li key={step.state} className={cn("flex min-w-0 items-center gap-2", active ? "flex-[2]" : "flex-1")}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 transition-colors",
                done && "bg-primary-500 text-white ring-primary-500",
                active && "bg-primary-500/10 text-primary-700 ring-primary-500 dark:text-primary-300",
                !done && !active && "bg-muted text-muted-foreground ring-border",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            {/* On phones only the current stage is named, so the others don't truncate to "A…". */}
            <span className={cn("truncate text-xs sm:inline sm:text-sm", active ? "font-semibold" : "hidden text-muted-foreground")}>{step.label}</span>
            {i < STEPS.length - 1 && <span className={cn("mx-1 hidden h-px flex-1 sm:block", done ? "bg-primary-500" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
