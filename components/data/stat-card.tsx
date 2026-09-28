import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/data/count-up";
import { cn } from "@/lib/utils";

const ACCENTS = {
  primary: "from-primary-400 to-primary-700",
  secondary: "from-secondary-400 to-secondary-600",
  info: "from-info to-primary-500",
  rose: "from-secondary-500 to-error",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
  href,
  loading,
  index = 0,
}: {
  label: string;
  value: number | undefined;
  hint?: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENTS;
  href?: string;
  loading?: boolean;
  index?: number;
}) {
  const body = (
    <div
      className={cn(
        "stat-card stagger-in group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-slow ease-out",
        href && "hover:-translate-y-1 hover:shadow-xl",
      )}
      style={{ "--stagger": index } as React.CSSProperties}
    >
      {/* Soft accent glow in the corner */}
      <div className={cn("pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-opacity duration-slow group-hover:opacity-30", ACCENTS[accent])} />
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-slow ease-spring group-hover:-rotate-6 group-hover:scale-110", ACCENTS[accent])}>
          <Icon className="size-5" />
        </span>
        {href && <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-normal group-hover:translate-x-0.5 group-hover:opacity-100" />}
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      {loading || value === undefined ? (
        <Skeleton className="mt-1.5 h-9 w-20" />
      ) : (
        <CountUp value={value} className="mt-1 block font-display text-3xl font-semibold tabular-nums" />
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block rounded-2xl focus-visible:outline-none">{body}</Link> : body;
}
