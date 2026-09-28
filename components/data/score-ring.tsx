import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} title={`Profile ${pct}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset] duration-slower ease-out", pct >= 70 ? "stroke-primary-500" : pct >= 40 ? "stroke-secondary-400" : "stroke-error")}
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold tabular-nums">{pct}</span>
    </span>
  );
}
