"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINES, type PipelineKey } from "@/lib/queries/dashboard";

// Status -> stack segment. Waiting states warm, in-progress blue, outcomes green / red.
const SEGMENTS: { key: string; label: string; color: string; statuses: string[] }[] = [
  { key: "waiting", label: "Waiting", color: "hsl(var(--color-secondary-400))", statuses: ["PUBLISHED", "PENDING"] },
  { key: "active", label: "In progress", color: "hsl(var(--color-info))", statuses: ["IN_REVIEW", "PAYMENT_PENDING", "PROCESSING"] },
  { key: "approved", label: "Approved", color: "hsl(var(--color-primary-500))", statuses: ["APPROVED"] },
  { key: "closed", label: "Declined", color: "hsl(var(--color-error) / 0.75)", statuses: ["DECLINED", "REJECTED"] },
];

export function PipelineChart({ areas, counts, loading }: {
  areas: PipelineKey[];
  counts: Record<string, Record<string, number | undefined>>;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  const data = areas.map((area) => {
    const row: Record<string, string | number> = { name: PIPELINES[area].label };
    for (const seg of SEGMENTS) {
      row[seg.key] = seg.statuses.reduce((sum, s) => sum + (counts[area]?.[s] ?? 0), 0);
    }
    return row;
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={18}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={96} tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.6)" }}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
          />
          {SEGMENTS.map((seg, i) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              name={seg.label}
              stackId="s"
              fill={seg.color}
              radius={i === SEGMENTS.length - 1 ? [0, 6, 6, 0] : 0}
              animationDuration={900}
              animationBegin={i * 120}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: seg.color }} /> {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
