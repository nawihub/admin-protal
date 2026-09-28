"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEnumLabel } from "@/lib/utils";
import type { CategoryAnalysis } from "@/lib/api/types";

const COLORS = [
  "hsl(var(--color-primary-500))",
  "hsl(var(--color-secondary-500))",
  "hsl(var(--color-info))",
  "hsl(var(--color-primary-300))",
  "hsl(var(--color-secondary-300))",
  "hsl(var(--color-warning))",
  "hsl(var(--color-primary-700))",
  "hsl(var(--color-secondary-700))",
];

export function CategoryDonut({ data, loading }: { data: CategoryAnalysis[] | undefined; loading: boolean }) {
  if (loading) return <Skeleton className="mx-auto size-48 rounded-full" />;
  const rows = (data ?? []).filter((d) => d.opportunityCount > 0).sort((a, b) => b.opportunityCount - a.opportunityCount);
  const total = rows.reduce((s, r) => s + r.opportunityCount, 0);
  if (!total) return <p className="py-16 text-center text-sm text-muted-foreground">No live opportunities yet.</p>;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="opportunityCount" nameKey="category" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none" animationDuration={900}>
              {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value as number, formatEnumLabel(String(name))]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold">{total}</span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">live</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {rows.slice(0, 6).map((r, i) => (
          <li key={r.category} className="stagger-in flex items-center gap-2" style={{ "--stagger": i } as React.CSSProperties}>
            <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{formatEnumLabel(r.category)}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.opportunityCount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
