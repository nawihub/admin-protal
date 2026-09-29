import { ArrowRight, Building, CalendarClock, Globe2, HandCoins } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { ProtectedImage } from "@/components/data/protected-image";
import { daysLeft } from "@/components/data/deadline";
import { Tile, TileLink } from "@/components/cards/tile";
import { opportunitiesApi } from "@/lib/api/admin";
import { cn, formatEnumLabel } from "@/lib/utils";
import type { Opportunity } from "@/lib/api/types";

function deadlineLabel(d: number) {
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  return d === 1 ? "1 day left" : `${d} days left`;
}

export function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  const d = daysLeft(o.deadline);
  const urgent = d !== null && d >= 0 && d <= 7;
  const categories = o.categories.map((c) => (c === "OTHER" && o.categoryOther ? o.categoryOther : formatEnumLabel(c)));
  const scope = o.geographicScope === "OTHER" && o.geographicScopeOther ? o.geographicScopeOther : o.geographicScope ? formatEnumLabel(o.geographicScope) : null;
  return (
    <Tile>
      <div className="tile-cover aspect-[16/9] shrink-0">
        <div className="tile-cover-media tile-pattern absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-700">
          <HandCoins className="size-14 text-white/80 drop-shadow-sm transition-transform duration-slower ease-spring group-hover:-rotate-6 group-hover:scale-110" />
        </div>
        {o.flierUrl && (
          <ProtectedImage
            queryKey={["opportunities", "flier", o.id]}
            fetcher={() => opportunitiesApi.flier(o.id)}
            alt=""
            // Fliers can be transparent PNGs - back them like paper so the cover gradient doesn't bleed through.
            className="tile-cover-media absolute inset-0 size-full bg-white object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/25" />
        <div className="absolute inset-x-3 top-3 z-[2] flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1">
            {categories.slice(0, 2).map((c) => (
              <span key={c} className="truncate rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{c}</span>
            ))}
            {categories.length > 2 && <span className="rounded-full bg-black/35 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">+{categories.length - 2}</span>}
          </div>
          <StatusBadge status={o.status} className="shrink-0 bg-card/95 shadow-sm" />
        </div>
        {d !== null && (
          <span className={cn(
            "absolute bottom-3 left-3 z-[2] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
            urgent ? "bg-error text-white" : d < 0 ? "bg-neutral-800/80 text-white/80" : "bg-card/95 text-foreground",
          )}>
            {urgent ? <span className="pulse-dot relative size-1.5 rounded-full bg-white" aria-hidden /> : <CalendarClock className="size-3" />}
            {deadlineLabel(d)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <TileLink href={`/opportunities/${o.id}`} className="line-clamp-2 font-display text-lg font-semibold leading-snug">{o.title}</TileLink>
        {o.organizationName && (
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground"><Building className="size-3.5 shrink-0" /><span className="truncate">{o.organizationName}</span></p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">{scope && <><Globe2 className="size-3.5 shrink-0" /><span className="truncate">{scope}</span></>}</span>
          <ArrowRight className="tile-arrow size-4 shrink-0 text-secondary-600 dark:text-secondary-300" aria-hidden />
        </div>
      </div>
    </Tile>
  );
}
