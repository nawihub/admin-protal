import { Bookmark, Star } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { ProtectedImage } from "@/components/data/protected-image";
import { ResourceIcon } from "@/components/resources/resource-drawer";
import { Tile, TileLink } from "@/components/cards/tile";
import { resourcesApi } from "@/lib/api/admin";
import { formatEnumLabel, formatFileSize } from "@/lib/utils";
import type { Resource } from "@/lib/api/types";

export function ResourceCard({ resource: r, onOpen }: { resource: Resource; onOpen: () => void }) {
  const video = r.type === "VIDEO";
  return (
    <Tile>
      <div className="tile-cover aspect-video shrink-0">
        <div className={`tile-cover-media tile-pattern absolute inset-0 flex items-center justify-center bg-gradient-to-br ${video ? "from-info to-primary-600" : "from-primary-400 to-secondary-400"}`}>
          <ResourceIcon resource={r} className="size-12 text-white/85 drop-shadow-sm transition-transform duration-slower ease-spring group-hover:scale-110" />
        </div>
        {r.thumbnailUrl && (
          <ProtectedImage queryKey={["resources", "thumb", r.id]} fetcher={() => resourcesApi.thumbnail(r.id)} alt="" className="tile-cover-media absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute inset-x-3 top-3 z-[2] flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{video ? "Video" : formatEnumLabel(r.format)}</span>
          <StatusBadge status={r.status} className="bg-card/95 shadow-sm" />
        </div>
        <div className="absolute inset-x-3 bottom-3 z-[2] flex items-center justify-between text-[11px] font-medium text-white">
          <span className="rounded-full bg-black/35 px-2 py-0.5 backdrop-blur-sm">{formatEnumLabel(r.accessLevel)}</span>
          {r.featured && <span className="flex items-center gap-1 rounded-full bg-secondary-400 px-2 py-0.5 shadow-sm"><Star className="size-3 fill-current" /> Featured</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <TileLink onClick={onOpen} className="line-clamp-2 font-display text-base font-semibold leading-snug">{r.title}</TileLink>
        <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span>{formatFileSize(r.fileSize)}</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Star className="size-3.5 fill-secondary-400 text-secondary-400" />{r.averageRating ? r.averageRating.toFixed(1) : "–"}</span>
            <span className="flex items-center gap-1"><Bookmark className="size-3.5" />{r.bookmarkCount}</span>
          </span>
        </div>
      </div>
    </Tile>
  );
}
