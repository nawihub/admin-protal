import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export function daysLeft(deadline: string | null | undefined) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
}

export function Deadline({ deadline }: { deadline: string }) {
  const d = daysLeft(deadline);
  if (d === null) return null;
  const urgent = d >= 0 && d <= 7;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-xs", d < 0 ? "text-muted-foreground line-through" : urgent ? "font-medium text-error" : "text-muted-foreground")}>
      <CalendarClock className="size-3.5" /> {formatDate(deadline)}
      {d >= 0 && <span className="no-underline">· {d === 0 ? "today" : `${d}d`}</span>}
    </span>
  );
}
