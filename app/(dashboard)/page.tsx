"use client";

import Link from "next/link";
import {
  Activity, ArrowRight, Building2, CheckCircle2, ClipboardList, FolderPlus, HandCoins, Lightbulb, ShieldPlus, Sparkles, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useBusinessCount, useEntrepreneurCount, useIdeaCount, useOpportunityCount } from "@/lib/queries/counts";
import { useAdminNames } from "@/lib/queries/admin-names";
import { type PipelineKey, useAttentionQueue, useCategoryAnalysis, usePipelineCounts, useRecentActivity } from "@/lib/queries/dashboard";
import { formatEnumLabel } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Panel({ title, icon: Icon, action, children, className, index = 0 }: {
  title: string; icon: React.ElementType; action?: React.ReactNode; children: React.ReactNode; className?: string; index?: number;
}) {
  return (
    <Card className={`stagger-in overflow-hidden ${className ?? ""}`} style={{ "--stagger": index + 4 } as React.CSSProperties}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { user, canRead, canManage, has } = usePermissions();
  const ideasOk = canRead("bigIdeas");
  const oppsOk = canRead("opportunities");
  const bizOk = canRead("businesses");
  const entOk = canRead("entrepreneurs");

  const ideasWaiting = useIdeaCount("PUBLISHED", ideasOk);
  const oppsWaiting = useOpportunityCount("PENDING", oppsOk);
  const bizWaiting = useBusinessCount("PENDING", bizOk);
  const entPending = useEntrepreneurCount({ status: "PENDING" }, entOk);
  const entActive = useEntrepreneurCount({ status: "ACTIVE" }, entOk);
  const entVetted = useEntrepreneurCount({ vetted: true }, entOk);

  const pipelineAreas = ([ideasOk && "ideas", oppsOk && "opportunities", bizOk && "businesses"].filter(Boolean)) as PipelineKey[];
  const pipeline = usePipelineCounts(pipelineAreas);
  const analysis = useCategoryAnalysis(oppsOk);
  const queue = useAttentionQueue({ ideas: ideasOk, opportunities: oppsOk, businesses: bizOk });
  const activity = useRecentActivity(has("READ_AUDIT_LOGS"));
  const nameOf = useAdminNames();

  const kpis = [
    ideasOk && { label: "Ideas awaiting review", value: ideasWaiting.data, icon: Lightbulb, accent: "secondary", href: "/big-ideas?status=PUBLISHED", hint: "Published by founders" },
    oppsOk && { label: "Opportunities to review", value: oppsWaiting.data, icon: HandCoins, accent: "primary", href: "/opportunities?status=PENDING", hint: "Community submissions" },
    bizOk && { label: "New business registrations", value: bizWaiting.data, icon: Building2, accent: "info", href: "/businesses?status=PENDING", hint: "Waiting to be processed" },
    entOk && { label: "Active entrepreneurs", value: entActive.data, icon: Users, accent: "rose", href: "/entrepreneurs?status=ACTIVE", hint: entVetted.data !== undefined ? `${entVetted.data} vetted · ${entPending.data ?? 0} onboarding` : undefined },
  ].filter(Boolean) as { label: string; value: number | undefined; icon: React.ElementType; accent: "primary" | "secondary" | "info" | "rose"; href: string; hint?: string }[];

  const attention = [
    ...(queue.ideas.data?.items ?? []).map((i) => ({ id: i.id, kind: "Big Idea", icon: Lightbulb, title: i.ideaName, sub: i.applicant.fullName, time: i.createTime, status: i.status, href: `/big-ideas/${i.id}` })),
    ...(queue.opportunities.data?.items ?? []).map((o) => ({ id: o.id, kind: "Opportunity", icon: HandCoins, title: o.title, sub: o.organizationName, time: o.createTime, status: o.status, href: `/opportunities/${o.id}` })),
    ...(queue.businesses.data?.items ?? []).map((b) => ({ id: b.id, kind: "Business", icon: Building2, title: b.businessName, sub: b.ownerName, time: b.createTime, status: b.status, href: `/businesses/${b.id}` })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(0, 8);
  const attentionLoading = queue.ideas.isLoading || queue.opportunities.isLoading || queue.businesses.isLoading;

  const quickActions = [
    canManage("resources") && { href: "/resources", label: "Upload a resource", icon: FolderPlus },
    canManage("adminUsers") && { href: "/users?new=1", label: "Add an admin", icon: ShieldPlus },
    canRead("auditLogs") && { href: "/audit-logs", label: "Review audit log", icon: ClipboardList },
  ].filter(Boolean) as { href: string; label: string; icon: React.ElementType }[];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="animate-drift pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary-500/15 blur-3xl" aria-hidden />
        <div className="animate-drift pointer-events-none absolute -bottom-24 right-40 size-64 rounded-full bg-secondary-500/12 blur-3xl [animation-delay:-5s]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="live-dot relative size-2 rounded-full bg-success text-success" /> Live · updates every minute
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              {greeting()}, <span className="text-primary-600 dark:text-primary-400">{user?.firstName}</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · here&apos;s what needs attention across NaWeHub.
            </p>
          </div>
          {quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickActions.map((a, i) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="stagger-in group inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3.5 py-2 text-sm font-medium shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary-400/60 hover:shadow-md"
                  style={{ "--stagger": i + 1 } as React.CSSProperties}
                >
                  <a.icon className="size-4 text-primary-600 transition-transform group-hover:scale-110 dark:text-primary-400" /> {a.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k, i) => <StatCard key={k.label} {...k} icon={k.icon as never} index={i} />)}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        {pipelineAreas.length > 0 && (
          <Panel title="Moderation pipeline" icon={Activity} className="lg:col-span-3" index={0}>
            <PipelineChart areas={pipelineAreas} counts={pipeline.counts} loading={pipeline.loading} />
          </Panel>
        )}
        {oppsOk && (
          <Panel title="Live opportunities" icon={Sparkles} className="lg:col-span-2" index={1}
            action={<Link href="/opportunities" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">View all</Link>}>
            <CategoryDonut data={analysis.data} loading={analysis.isLoading} />
          </Panel>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Attention queue */}
        {(ideasOk || oppsOk || bizOk) && (
          <Panel title="Needs your attention" icon={CheckCircle2} className="lg:col-span-3" index={2}
            action={<span className="text-xs text-muted-foreground">Oldest first</span>}>
            {attentionLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : attention.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="float-slow flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success"><CheckCircle2 className="size-6" /></span>
                <p className="font-display font-semibold">All caught up</p>
                <p className="text-sm text-muted-foreground">Nothing is waiting on a decision right now.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {attention.map((item, i) => (
                  <li key={`${item.kind}-${item.id}`} className="stagger-in" style={{ "--stagger": i } as React.CSSProperties}>
                    <Link href={item.href} className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary-500/10 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        <item.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{item.kind} · {item.sub} · {timeAgo(item.time)}</span>
                      </span>
                      <StatusBadge status={item.status} className="hidden sm:inline-flex" />
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {/* Recent activity */}
        {has("READ_AUDIT_LOGS") && (
          <Panel title="Recent admin activity" icon={ClipboardList} className="lg:col-span-2" index={3}
            action={<Link href="/audit-logs" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">Audit log</Link>}>
            {activity.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : !activity.data?.content.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {activity.data.content.map((log, i) => (
                  <li key={log.id} className="stagger-in relative" style={{ "--stagger": i } as React.CSSProperties}>
                    <span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-primary-500 ring-4 ring-card" />
                    <p className="text-sm"><b className="font-semibold">{nameOf(log.userId)}</b> <span className="text-muted-foreground">{(log.message || `${formatEnumLabel(log.action)} ${formatEnumLabel(log.resource)}`).replace(/^./, (c) => c.toLowerCase())}</span></p>
                    {log.createTime && <p className="text-xs text-muted-foreground">{timeAgo(log.createTime)}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}
      </div>

      {kpis.length === 0 && !has("READ_AUDIT_LOGS") && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Your account doesn&apos;t have access to any dashboard areas yet. Ask an administrator to grant you permissions.
        </div>
      )}
    </div>
  );
}
