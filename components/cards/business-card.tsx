import { ArrowRight, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { SegmentMeter, Tile, TileLink, gradientFor } from "@/components/cards/tile";
import { cn, formatEnumLabel } from "@/lib/utils";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Business, BusinessStatus } from "@/lib/api/types";

// How far through registration each status is: submitted -> review -> fee -> paid -> registered.
const PROGRESS: Record<BusinessStatus, { step: number; hint: string }> = {
  PENDING: { step: 1, hint: "Submitted - waiting for review" },
  IN_REVIEW: { step: 2, hint: "Being reviewed" },
  PAYMENT_PENDING: { step: 3, hint: "Registration fee requested" },
  PROCESSING: { step: 4, hint: "Fee paid - ready to register" },
  APPROVED: { step: 5, hint: "Registered" },
  REJECTED: { step: 5, hint: "Registration rejected" },
};

export function BusinessCard({ business: b }: { business: Business }) {
  const progress = PROGRESS[b.status] ?? PROGRESS.PENDING;
  const category = b.businessCategory === "OTHER" && b.otherCategory ? b.otherCategory : formatEnumLabel(b.businessCategory);
  const gradient = gradientFor(b.businessName);
  return (
    <Tile>
      <div className="tile-cover h-20 shrink-0">
        <div className={cn("tile-cover-media tile-pattern absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />
        <div className="relative flex items-start justify-between gap-2 p-3">
          <span className="truncate rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{category}</span>
          <StatusBadge status={b.status} className="shrink-0 bg-card/95 shadow-sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        {/* Monogram overlaps the banner like a logo. */}
        <div className="-mt-7 flex items-end gap-3">
          <span aria-hidden className={cn(
            "relative z-[2] flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-lg font-semibold text-white shadow-md ring-4 ring-card transition-transform duration-slow ease-spring group-hover:-translate-y-1 group-hover:-rotate-3",
            gradient,
          )}>
            {initialsOf(b.businessName)}
          </span>
          <span className="mb-1 font-mono text-[11px] text-muted-foreground">#{b.trackingId}</span>
        </div>
        <div className="space-y-1">
          <TileLink href={`/businesses/${b.id}`} className="line-clamp-2 font-display text-lg font-semibold leading-snug">{b.businessName}</TileLink>
          <p className="truncate text-sm text-muted-foreground">{b.ownerName} · {formatEnumLabel(b.businessEntityType)}</p>
        </div>
        <div className="space-y-1.5">
          <SegmentMeter value={progress.step} total={5} tone={b.status === "REJECTED" ? "error" : b.status === "APPROVED" ? "primary" : "secondary"} label={progress.hint} />
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{progress.hint}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            {b.businessAddress && <><MapPin className="size-3.5 shrink-0" /><span className="truncate">{b.businessAddress}</span></>}
          </span>
          <span className="flex shrink-0 items-center gap-2">{timeAgo(b.createTime)}<ArrowRight className="tile-arrow size-4 text-primary-600 dark:text-primary-400" aria-hidden /></span>
        </div>
      </div>
    </Tile>
  );
}
