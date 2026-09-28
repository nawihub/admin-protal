import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> {label}
    </Link>
  );
}

/** Title block with status, metadata chips and (permission-gated) actions. */
export function DetailHeader({ icon, title, subtitle, status, meta, actions }: {
  icon: React.ReactNode; title: string; subtitle?: React.ReactNode; status?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in-up relative mb-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="animate-drift pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary-500/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-wrap items-start gap-4">
        <div className="animate-scale-in">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{status}</div>
          <h1 className="mt-1.5 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {meta && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}

export function Section({ title, children, className, index = 0 }: { title: string; children: React.ReactNode; className?: string; index?: number }) {
  return (
    <section className={cn("stagger-in rounded-2xl border border-border bg-card p-5 shadow-sm", className)} style={{ "--stagger": index + 1 } as React.CSSProperties}>
      <h2 className="mb-4 font-display text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** A labelled value; renders nothing when empty so sections stay tidy. */
export function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
