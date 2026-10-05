import { cn, formatEnumLabel } from "@/lib/utils";

type Tone = "neutral" | "info" | "warning" | "success" | "error" | "brand";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-info/10 text-info ring-info/25",
  warning: "bg-warning/12 text-[hsl(38_92%_38%)] ring-warning/30 dark:text-warning",
  success: "bg-success/10 text-success ring-success/25",
  error: "bg-error/10 text-error ring-error/25",
  brand: "bg-primary-500/10 text-primary-700 ring-primary-500/25 dark:text-primary-300",
};

// One vocabulary across services: which statuses need attention, which are done.
const STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  PUBLISHED: "warning",
  IN_REVIEW: "info",
  PAYMENT_PENDING: "warning",
  PROCESSING: "info",
  APPROVED: "success",
  ACTIVE: "success",
  DECLINED: "error",
  REJECTED: "error",
  SUSPENDED: "error",
  DISABLED: "neutral",
  DELETED: "neutral",
  INACTIVE: "neutral",
  DRAFT: "neutral",
  // Competitions and their applications
  SHORTLISTING: "info",
  PITCH_VIDEO: "info",
  FINALS: "brand",
  COMPLETED: "success",
  CANCELLED: "neutral",
  SUBMITTED: "warning",
  SHORTLISTED: "info",
  NOT_SHORTLISTED: "neutral",
  FINALIST: "brand",
  NOT_ADVANCED: "neutral",
  WINNER: "success",
  WITHDRAWN: "neutral",
};

// Labels that read better than the raw enum.
const LABELS: Record<string, string> = {
  PUBLISHED: "Awaiting review",
  PENDING: "Pending",
  PAYMENT_PENDING: "Payment due",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const pulsing = tone === "warning" || tone === "info";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", TONES[tone], className)}>
      <span className={cn("relative size-1.5 rounded-full bg-current", pulsing && "live-dot")} aria-hidden />
      {label ?? LABELS[status] ?? formatEnumLabel(status)}
    </span>
  );
}

export function Tag({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", TONES[tone], className)}>{children}</span>;
}
