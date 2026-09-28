"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileSearch, HandCoins, Loader2, Mail, Phone, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog, ReasonDialog } from "@/components/data/action-dialogs";
import { ProtectedImage } from "@/components/data/protected-image";
import { Deadline } from "@/components/data/deadline";
import { opportunitiesApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { formatEnumLabel } from "@/lib/utils";
import { formatDate } from "@/lib/format";

function withOther(values: string[], other: string | null) {
  return values.map((v) => (v === "OTHER" && other ? other : formatEnumLabel(v)));
}

function OpportunityDetail({ id }: { id: string }) {
  const router = useRouter();
  const { canManage } = usePermissions();
  const manage = canManage("opportunities");
  const { data: o, isLoading, isError } = useQuery({ queryKey: ["opportunities", "detail", id], queryFn: () => opportunitiesApi.get(id) });
  const [dialog, setDialog] = useState<"decline" | "delete" | null>(null);

  const invalidate = [["opportunities"]] as const;
  const review = useAction(() => opportunitiesApi.review(id), { success: "Moved to review", invalidate });
  const approve = useAction(() => opportunitiesApi.approve(id), { success: "Opportunity approved - it's now public", invalidate });
  const decline = useAction((reason: string) => opportunitiesApi.decline(id, reason), { success: "Opportunity declined", invalidate });
  const remove = useAction(() => opportunitiesApi.remove(id), { success: "Opportunity deleted", invalidate });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !o) return <p className="py-20 text-center text-muted-foreground">This opportunity couldn&apos;t be found.</p>;

  const s = o.status;
  const actions = manage && (
    <>
      {s === "PENDING" && (
        <Button onClick={() => review.mutate()} disabled={review.isPending}>
          {review.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />} Start review
        </Button>
      )}
      {(s === "PENDING" || s === "IN_REVIEW") && (
        <>
          <Button variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => approve.mutate()} disabled={approve.isPending}>
            {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Approve
          </Button>
          <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("decline")}>
            <XCircle className="size-4" /> Decline
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" aria-label="Delete opportunity" onClick={() => setDialog("delete")}>
        <Trash2 className="size-4 text-error" />
      </Button>
    </>
  );

  const scope = o.geographicScope === "OTHER" && o.geographicScopeOther ? o.geographicScopeOther : o.geographicScope ? formatEnumLabel(o.geographicScope) : "";

  return (
    <>
      <BackLink href="/opportunities" label="Opportunities" />
      <DetailHeader
        icon={<span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-white shadow-lg"><HandCoins className="size-7" /></span>}
        status={<><StatusBadge status={s} />{withOther(o.categories, o.categoryOther).map((c) => <Tag key={c}>{c}</Tag>)}</>}
        title={o.title}
        subtitle={o.organizationName}
        meta={<><span>Submitted {formatDate(o.createTime, true)}</span><Deadline deadline={o.deadline} /></>}
        actions={actions}
      />

      {s === "DECLINED" && o.declineReason && (
        <div className="animate-fade-in-up mb-6 rounded-2xl border border-error/25 bg-error/5 p-4 text-sm">
          <p className="font-medium text-error">Decline reason</p>
          <p className="mt-1">{o.declineReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="About" index={0}>
            <FieldGrid>
              <Field label="Description" full>{o.description}</Field>
              <Field label="Eligibility" full>{o.eligibilityCriteria}</Field>
              <Field label="Organization type">{withOther(o.organizationTypes, o.organizationTypeOther).join(", ")}</Field>
              <Field label="Who it's for">{withOther(o.targetBeneficiaries, o.targetBeneficiaryOther).join(", ")}</Field>
              <Field label="Geographic scope">{scope}</Field>
              <Field label="Deadline">{formatDate(o.deadline)}</Field>
            </FieldGrid>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Flier" index={1}>
            {o.flierUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <ProtectedImage
                  queryKey={["opportunities", "flier", id]}
                  fetcher={() => opportunitiesApi.flier(id)}
                  alt={`${o.title} flier`}
                  className="w-full"
                  fallback={<div className="tile-pattern aspect-[3/4] w-full animate-pulse bg-gradient-to-br from-secondary-400/40 to-secondary-600/40" />}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flier attached.</p>
            )}
          </Section>
          <Section title="Contact & apply" index={2}>
            <ul className="space-y-2 text-sm">
              {o.contactInfo?.email && <li className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><a className="hover:underline" href={`mailto:${o.contactInfo.email}`}>{o.contactInfo.email}</a></li>}
              {o.contactInfo?.phone && <li className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{o.contactInfo.phone}</li>}
              {o.contactInfo?.additionalContact && <li className="text-muted-foreground">{o.contactInfo.additionalContact}</li>}
            </ul>
            {o.applicationLink && (
              <Button asChild variant="outline" className="mt-4 w-full">
                <a href={o.applicationLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Open application link</a>
              </Button>
            )}
          </Section>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "decline"}
        onOpenChange={(open) => setDialog(open ? "decline" : null)}
        title="Decline this opportunity"
        description="The submitter receives this reason."
        confirmLabel="Decline"
        pending={decline.isPending}
        onSubmit={(reason) => decline.mutate(reason, { onSuccess: () => setDialog(null) })}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title="Delete this opportunity?"
        description="It's permanently removed along with its flier. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.replace("/opportunities") })}
      />
    </>
  );
}

export default function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="opportunities" label="Opportunities">
      <div className="mx-auto max-w-6xl"><OpportunityDetail id={id} /></div>
    </RequireArea>
  );
}
