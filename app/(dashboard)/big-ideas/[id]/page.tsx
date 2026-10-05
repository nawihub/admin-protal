"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Copy, Download, Eye, FileSearch, Lightbulb, Loader2, Mail, MapPin, Phone, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog, ReasonDialog } from "@/components/data/action-dialogs";
import { ideasApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useDownload } from "@/lib/hooks/use-download";
import { formatEnumLabel } from "@/lib/utils";
import { formatDate } from "@/lib/format";

function IdeaDetail({ id }: { id: string }) {
  const router = useRouter();
  const { canManage } = usePermissions();
  const manage = canManage("bigIdeas");
  const { data: idea, isLoading, isError } = useQuery({ queryKey: ["ideas", "detail", id], queryFn: () => ideasApi.get(id) });
  const [dialog, setDialog] = useState<"decline" | "delete" | null>(null);
  const { busy, download } = useDownload();

  const invalidate = [["ideas"]] as const;
  const review = useAction(() => ideasApi.review(id), { success: "Moved to review", invalidate });
  const approve = useAction(() => ideasApi.approve(id), { success: "Idea approved - it's now public", invalidate });
  const decline = useAction((reason: string) => ideasApi.decline(id, reason), { success: "Idea declined", invalidate });
  const remove = useAction(() => ideasApi.remove(id), { success: "Idea deleted", invalidate });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !idea) return <p className="py-20 text-center text-muted-foreground">This idea couldn&apos;t be found.</p>;

  const s = idea.status;
  const actions = manage && (
    <>
      {s === "PUBLISHED" && (
        <Button onClick={() => review.mutate()} disabled={review.isPending}>
          {review.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />} Start review
        </Button>
      )}
      {(s === "PUBLISHED" || s === "IN_REVIEW") && (
        <>
          <Button variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => approve.mutate()} disabled={approve.isPending}>
            {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Approve
          </Button>
          <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("decline")}>
            <XCircle className="size-4" /> Decline
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" aria-label="Delete idea" onClick={() => setDialog("delete")}>
        <Trash2 className="size-4 text-error" />
      </Button>
    </>
  );

  const sections: { title: string; fields: [string, string | undefined][] }[] = [
    { title: "The idea", fields: [["Description", idea.description], ["Problem", idea.problemStatement], ["Who has the problem", idea.problemAudience], ["Current solution", idea.currentSolution], ["Proposed solution", idea.proposedSolution], ["What's new", idea.innovationDescription], ["Inspiration", idea.inspiration]] },
    { title: "Market & business", fields: [["Target customers", idea.targetCustomers], ["Customer location", idea.customerLocation], ["Market size", idea.marketSize], ["Competitors", idea.competitors], ["Competitive advantage", idea.competitiveAdvantage], ["Revenue model", idea.revenueModel], ["Product or service", idea.productOrService], ["Pricing", idea.pricingStrategy], ["Main costs", idea.mainCosts], ["Startup capital needed", idea.startupCapitalNeeded], ["First-year revenue", idea.firstYearRevenueEstimate], ["Potential partners", idea.potentialPartners]] },
    { title: "Readiness & impact", fields: [["Testing learnings", idea.testingLearnings], ["Existing resources", idea.existingResources], ["Challenges & risks", idea.challengesAndRisks], ["Risk mitigation", idea.riskMitigationPlan], ["Social impact", idea.socialImpact], ["Environmental impact", idea.environmentalImpact], ["Jobs created", idea.estimatedJobsCreated], ["Growth plan", idea.growthPlan], ["Why it should be selected", idea.whySelected]] },
  ];

  return (
    <>
      <BackLink href="/big-ideas" label="Big Ideas" />
      <DetailHeader
        icon={<span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-300 to-primary-500 text-white shadow-lg"><Lightbulb className="size-7" /></span>}
        status={<><StatusBadge status={s} /><Tag>{formatEnumLabel(idea.stage)}</Tag>{idea.testedWithCustomers && <Tag tone="success">Tested with customers</Tag>}</>}
        title={idea.ideaName}
        subtitle={idea.oneLineDescription}
        meta={
          <>
            <span>Submitted {formatDate(idea.createTime, true)}</span>
            {idea.trackingId && (
              <button type="button" className="inline-flex items-center gap-1 font-mono hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(idea.trackingId!); toast("Tracking ID copied"); }}>
                #{idea.trackingId} <Copy className="size-3" />
              </button>
            )}
          </>
        }
        actions={actions}
      />

      {s === "DECLINED" && idea.declineReason && (
        <div className="animate-fade-in-up mb-6 rounded-2xl border border-error/25 bg-error/5 p-4 text-sm">
          <p className="font-medium text-error">Decline reason</p>
          <p className="mt-1">{idea.declineReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {sections.map((sec, i) =>
            sec.fields.some(([, v]) => v) ? (
              <Section key={sec.title} title={sec.title} index={i}>
                <FieldGrid>{sec.fields.map(([label, v]) => <Field key={label} label={label} full={(v?.length ?? 0) > 120}>{v}</Field>)}</FieldGrid>
              </Section>
            ) : null,
          )}
        </div>
        <div className="space-y-6">
          <Section title="Applicant" index={3}>
            <p className="font-medium">{idea.applicant.fullName}</p>
            {/* Ideas take these from the entrepreneur's profile, which may not have all of them. */}
            <p className="text-sm text-muted-foreground">
              {[formatEnumLabel(idea.applicant.submissionType), idea.applicant.occupation, idea.applicant.age ? `${idea.applicant.age} yrs` : null]
                .filter(Boolean).join(" · ")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><a className="hover:underline" href={`mailto:${idea.applicant.email}`}>{idea.applicant.email}</a></li>
              {idea.applicant.phone && <li className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{idea.applicant.phone}</li>}
              {idea.applicant.location && <li className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{idea.applicant.location}</li>}
            </ul>
          </Section>
          <Section title={`Supporting material (${idea.supportingMaterials.length})`} index={4}>
            {idea.supportingMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground">None attached.</p>
            ) : (
              <ul className="space-y-2">
                {idea.supportingMaterials.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{formatEnumLabel(m.type)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(m.uploadedAt)}</span>
                    </span>
                    <Button variant="ghost" size="icon" aria-label="Preview" disabled={busy !== null} onClick={() => download(m.id + "open", () => ideasApi.material(m.url), m.type, "open")}>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Download" disabled={busy !== null} onClick={() => download(m.id, () => ideasApi.material(m.url), `${idea.ideaName} - ${formatEnumLabel(m.type)}`)}>
                      {busy === m.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "decline"}
        onOpenChange={(o) => setDialog(o ? "decline" : null)}
        title="Decline this idea"
        description="The applicant receives this reason by email."
        confirmLabel="Decline idea"
        pending={decline.isPending}
        onSubmit={(reason) => decline.mutate(reason, { onSuccess: () => setDialog(null) })}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title="Delete this idea?"
        description="The idea and its files are permanently removed. This can't be undone."
        confirmLabel="Delete idea"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.replace("/big-ideas") })}
      />
    </>
  );
}

export default function BigIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="bigIdeas" label="Big Ideas">
      <div className="mx-auto max-w-6xl"><IdeaDetail id={id} /></div>
    </RequireArea>
  );
}
