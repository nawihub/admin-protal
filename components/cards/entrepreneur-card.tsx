import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ProtectedImage } from "@/components/data/protected-image";
import { ScoreRing } from "@/components/data/score-ring";
import { Tile, TileLink, gradientFor } from "@/components/cards/tile";
import { entrepreneursApi } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Entrepreneur } from "@/lib/api/types";

export function EntrepreneurCard({ entrepreneur: e }: { entrepreneur: Entrepreneur }) {
  const name = `${e.firstName} ${e.lastName}`;
  const gradient = gradientFor(name);
  const initials = (
    <span className={cn("flex size-full items-center justify-center bg-gradient-to-br font-display text-xl font-semibold text-white", gradient)}>{initialsOf(name)}</span>
  );
  return (
    <Tile>
      <div className="tile-cover h-20 shrink-0">
        <div className={cn("tile-cover-media tile-pattern absolute inset-0 bg-gradient-to-br opacity-80", gradient)} />
        <div className="relative flex items-start justify-end gap-1.5 p-3">
          {e.featured && (
            <span className="flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-semibold text-secondary-600 shadow-sm dark:text-secondary-300">
              <Star className="size-3 fill-current" /> Featured
            </span>
          )}
          <StatusBadge status={e.status?.status ?? "PENDING"} className="bg-card/95 shadow-sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="-mt-9 flex items-end justify-between">
          <span className="relative z-[2] block size-[4.5rem] overflow-hidden rounded-full shadow-md ring-4 ring-card transition-transform duration-slow ease-spring group-hover:-translate-y-1 group-hover:scale-105">
            {e.profilePhotoUrl ? (
              <ProtectedImage queryKey={["entrepreneurs", "photo", e.id]} fetcher={() => entrepreneursApi.photo(e.id)} alt="" className="absolute inset-0 size-full object-cover" fallback={initials} />
            ) : initials}
          </span>
          <ScoreRing score={e.profileScore} size={40} />
        </div>
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5">
            <TileLink href={`/entrepreneurs/${e.id}`} className="truncate font-display text-lg font-semibold">{name}</TileLink>
            {e.vetted && <BadgeCheck className="relative z-[2] size-5 shrink-0 text-primary-500" aria-label="Vetted" />}
          </p>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" /> {[e.district, e.currentLocation].filter(Boolean).join(" · ") || "Location not set"}
          </p>
        </div>
        {e.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {e.skills.slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}
            {e.skills.length > 3 && <Tag>+{e.skills.length - 3}</Tag>}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span>{e.needFunding ? "Seeking funding" : e.hasReceivedFunding ? "Funded" : `Joined ${timeAgo(e.createTime)}`}</span>
          <ArrowRight className="tile-arrow size-4 text-primary-600 dark:text-primary-400" aria-hidden />
        </div>
      </div>
    </Tile>
  );
}
