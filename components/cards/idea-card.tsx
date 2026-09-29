import { ArrowRight, Lightbulb, MapPin, Paperclip } from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { SegmentMeter, Tile, TileLink } from "@/components/cards/tile";
import { formatEnumLabel, cn } from "@/lib/utils";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Idea } from "@/lib/api/types";

const STAGES = ["CONCEPT_ONLY", "RESEARCH_COMPLETED", "PROTOTYPE_DEVELOPED", "TESTING_PILOT", "ALREADY_OPERATING"];

// The cover warms from orange (a concept) to deep green (an operating venture).
const COVERS: Record<string, string> = {
  CONCEPT_ONLY: "from-secondary-300 via-secondary-400 to-secondary-500",
  RESEARCH_COMPLETED: "from-secondary-400 via-secondary-300 to-primary-400",
  PROTOTYPE_DEVELOPED: "from-primary-300 via-primary-400 to-primary-500",
  TESTING_PILOT: "from-primary-400 via-primary-500 to-primary-600",
  ALREADY_OPERATING: "from-primary-500 via-primary-600 to-primary-800",
};

export function IdeaCard({ idea }: { idea: Idea }) {
  const stage = Math.max(0, STAGES.indexOf(idea.stage));
  return (
    <Tile>
      <div className="tile-cover h-24 shrink-0">
        <div className={cn("tile-cover-media tile-pattern absolute inset-0 bg-gradient-to-br", COVERS[idea.stage] ?? COVERS.CONCEPT_ONLY)} />
        <Lightbulb className="absolute -bottom-5 -right-3 size-24 rotate-12 text-white/20 transition-transform duration-slower ease-out group-hover:-rotate-6 group-hover:scale-110" />
        <div className="relative flex items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{formatEnumLabel(idea.stage)}</span>
          <StatusBadge status={idea.status} className="bg-card/95 shadow-sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <TileLink href={`/big-ideas/${idea.id}`} className="line-clamp-2 font-display text-lg font-semibold leading-snug">{idea.ideaName}</TileLink>
          <p className="line-clamp-2 text-sm text-muted-foreground">{idea.oneLineDescription}</p>
        </div>
        <div className="space-y-1.5">
          <SegmentMeter value={stage + 1} total={STAGES.length} label={`Stage ${stage + 1} of ${STAGES.length}`} />
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Stage {stage + 1} of {STAGES.length}</p>
        </div>
        <div className="mt-auto flex items-center gap-2.5 border-t border-border/70 pt-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{initialsOf(idea.applicant.fullName)}</span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-medium">{idea.applicant.fullName}</p>
            <p className="flex items-center gap-2 truncate text-muted-foreground">
              {idea.applicant.location && <span className="flex items-center gap-0.5"><MapPin className="size-3" />{idea.applicant.location}</span>}
              <span className="flex items-center gap-0.5"><Paperclip className="size-3" />{idea.supportingMaterials.length}</span>
              <span>{timeAgo(idea.createTime)}</span>
            </p>
          </div>
          <ArrowRight className="tile-arrow size-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
        </div>
      </div>
    </Tile>
  );
}
