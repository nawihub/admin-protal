"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Ban, Briefcase, Globe, Loader2, Mail, MapPin, MessageCircle, Phone, PlayCircle, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog, ReasonDialog } from "@/components/data/action-dialogs";
import { ProtectedImage } from "@/components/data/protected-image";
import { ScoreRing } from "@/components/data/score-ring";
import { CountUp } from "@/components/data/count-up";
import { entrepreneursApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { formatEnumLabel } from "@/lib/utils";
import { formatDate, initialsOf } from "@/lib/format";

function EntrepreneurDetail({ id }: { id: string }) {
  const { canManage } = usePermissions();
  const manage = canManage("entrepreneurs");
  const { data: e, isLoading, isError } = useQuery({ queryKey: ["entrepreneurs", "detail", id], queryFn: () => entrepreneursApi.get(id) });
  const ventures = useQuery({ queryKey: ["entrepreneurs", "ventures", id], queryFn: () => entrepreneursApi.ventures(id), enabled: !!e });
  const journeys = useQuery({ queryKey: ["entrepreneurs", "journeys", id], queryFn: () => entrepreneursApi.journeys(id), enabled: !!e });
  const [dialog, setDialog] = useState<"suspend" | "vet" | "feature" | null>(null);

  const invalidate = [["entrepreneurs"]] as const;
  const activate = useAction(() => entrepreneursApi.activate(id), { success: "Entrepreneur activated", invalidate });
  const vet = useAction(() => entrepreneursApi.vet(id), { success: "Marked as vetted", invalidate });
  const feature = useAction(() => entrepreneursApi.feature(id), { success: "Now featured", invalidate });
  const suspend = useAction((reason: string) => entrepreneursApi.suspend(id, reason), { success: "Entrepreneur suspended", invalidate });
  const unsuspend = useAction(() => entrepreneursApi.unsuspend(id), { success: "Suspension lifted", invalidate });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !e) return <p className="py-20 text-center text-muted-foreground">This entrepreneur couldn&apos;t be found.</p>;

  const name = `${e.firstName} ${e.lastName}`;
  const s = e.status?.status ?? "PENDING";
  const suspended = s === "SUSPENDED";

  const actions = manage && (
    <>
      {(s === "PENDING" || s === "INACTIVE") && (
        <Button onClick={() => activate.mutate()} disabled={activate.isPending}>
          {activate.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />} Activate
        </Button>
      )}
      {!suspended && !e.vetted && (
        <Button variant="outline" onClick={() => setDialog("vet")}><BadgeCheck className="size-4" /> Vet</Button>
      )}
      {!suspended && !e.featured && (
        <Button variant="outline" onClick={() => setDialog("feature")}><Star className="size-4" /> Feature</Button>
      )}
      {suspended ? (
        <Button variant="outline" onClick={() => unsuspend.mutate()} disabled={unsuspend.isPending}>
          {unsuspend.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Lift suspension
        </Button>
      ) : (
        <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("suspend")}>
          <Ban className="size-4" /> Suspend
        </Button>
      )}
    </>
  );

  const avatarFallback = (
    <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary-300 to-primary-600 font-display text-xl font-semibold text-white">{initialsOf(name)}</span>
  );
  const impact = e.story?.impact;

  return (
    <>
      <BackLink href="/entrepreneurs" label="Entrepreneurs" />
      <DetailHeader
        icon={
          <span className="relative block size-16 overflow-hidden rounded-2xl shadow-lg ring-4 ring-card">
            {e.profilePhotoUrl ? (
              <ProtectedImage queryKey={["entrepreneurs", "photo", id]} fetcher={() => entrepreneursApi.photo(id)} alt={name} className="absolute inset-0 size-full object-cover" fallback={avatarFallback} />
            ) : avatarFallback}
          </span>
        }
        status={
          <>
            <StatusBadge status={s} />
            {e.vetted && <Tag tone="brand"><BadgeCheck className="mr-1 size-3" /> Vetted</Tag>}
            {e.featured && <Tag tone="warning"><Star className="mr-1 size-3" /> Featured</Tag>}
            {e.needFunding && <Tag>Seeking funding</Tag>}
          </>
        }
        title={name}
        subtitle={[e.pronoun, e.currentLocation].filter(Boolean).join(" · ")}
        meta={<><span>Joined {formatDate(e.createTime)}</span><span>Updated {formatDate(e.updateTime)}</span></>}
        actions={actions}
      />

      {suspended && e.status?.suspensionReason && (
        <div className="animate-fade-in-up mb-6 rounded-2xl border border-error/25 bg-error/5 p-4 text-sm">
          <p className="font-medium text-error">Suspended</p>
          <p className="mt-1">{e.status.suspensionReason}</p>
        </div>
      )}

      {impact && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["Jobs created", impact.jobs], ["Customers", impact.customers], ["Beneficiaries", impact.beneficiaries], ["Communities", impact.communities]] as const).map(([label, v], i) => (
            <div key={label} className="stat-card stagger-in rounded-2xl border border-border bg-card p-4 shadow-sm" style={{ "--stagger": i } as React.CSSProperties}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums"><CountUp value={v ?? 0} /></p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Story" index={0}>
            <FieldGrid>
              <Field label="About" full>{e.story?.aboutMe}</Field>
              <Field label="Success story" full>{e.story?.successStory}</Field>
              <Field label="Started in">{e.story?.yearStarted || null}</Field>
              <Field label="Received funding">{e.hasReceivedFunding ? "Yes" : "No"}</Field>
            </FieldGrid>
            {e.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">{e.skills.map((sk) => <Tag key={sk}>{sk}</Tag>)}</div>
            )}
          </Section>

          <Section title={`Ventures${ventures.data ? ` (${ventures.data.length})` : ""}`} index={1}>
            {ventures.isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : !ventures.data?.length ? (
              <p className="text-sm text-muted-foreground">No ventures listed.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {ventures.data.map((v, i) => (
                  <div key={v.id} className="card-interactive stagger-in rounded-xl border border-border p-4" style={{ "--stagger": i } as React.CSSProperties}>
                    <div className="flex items-start gap-2">
                      <Briefcase className="mt-0.5 size-4 shrink-0 text-primary-500" />
                      <div className="min-w-0">
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{[v.sector, v.stage, v.type].filter(Boolean).map(formatEnumLabel).join(" · ")}</p>
                      </div>
                    </div>
                    {v.solution && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v.solution}</p>}
                    <p className="mt-3 flex gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">{v.jobs ?? 0}</b> jobs</span><span><b className="text-foreground">{v.customersReached ?? 0}</b> customers</span></p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Journey" index={2}>
            {journeys.isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : !journeys.data?.length ? (
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-border pl-5">
                {[...journeys.data].sort((a, b) => b.year - a.year).map((j, i) => (
                  <li key={j.id} className="stagger-in relative" style={{ "--stagger": i } as React.CSSProperties}>
                    <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-card bg-primary-500 ring-2 ring-primary-500/20" />
                    <p className="font-mono text-xs text-muted-foreground">{j.year}</p>
                    <p className="font-medium">{j.title}</p>
                    {j.desc && <p className="mt-0.5 text-sm text-muted-foreground">{j.desc}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Profile strength" index={3}>
            <div className="flex items-center gap-4">
              <ScoreRing score={e.profileScore} size={64} />
              <p className="text-sm text-muted-foreground">How complete this profile is. Stronger profiles rank higher in discovery.</p>
            </div>
          </Section>
          <Section title="Contact" index={4}>
            <ul className="space-y-2 text-sm">
              {e.contactInfo?.email && <li className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><a className="truncate hover:underline" href={`mailto:${e.contactInfo.email}`}>{e.contactInfo.email}</a></li>}
              {e.contactInfo?.phoneNumber && <li className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{e.contactInfo.phoneNumber}</li>}
              {e.contactInfo?.whatsappNumber && <li className="flex items-center gap-2"><MessageCircle className="size-4 text-muted-foreground" />{e.contactInfo.whatsappNumber}</li>}
              <li className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{[e.chiefdom, e.district].filter(Boolean).join(", ")}</li>
            </ul>
            {e.socialLinks && Object.values(e.socialLinks).some(Boolean) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(e.socialLinks).filter(([, url]) => url).map(([k, url]) => (
                  <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted">
                    <Globe className="size-3" /> {formatEnumLabel(k)}
                  </a>
                ))}
              </div>
            )}
          </Section>
          <Section title="Personal" index={5}>
            <FieldGrid>
              <Field label="Gender">{e.gender ? formatEnumLabel(e.gender) : null}</Field>
              <Field label="Nationality">{e.nationality}</Field>
              <Field label="Date of birth">{e.dateOfBirth ? formatDate(e.dateOfBirth) : null}</Field>
            </FieldGrid>
            {e.education.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {e.education.map((ed, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{ed.qualification}</p>
                    <p className="text-xs text-muted-foreground">{ed.institution} · {ed.startYear}–{ed.endYear || "now"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <ReasonDialog
        open={dialog === "suspend"}
        onOpenChange={(open) => setDialog(open ? "suspend" : null)}
        title={`Suspend ${e.firstName}`}
        description="Their profile is hidden and they can't sign in until the suspension is lifted."
        confirmLabel="Suspend"
        pending={suspend.isPending}
        onSubmit={(reason) => suspend.mutate(reason, { onSuccess: () => setDialog(null) })}
      />
      <ConfirmDialog
        open={dialog === "vet"}
        onOpenChange={(open) => setDialog(open ? "vet" : null)}
        title={`Vet ${e.firstName}?`}
        description="Vetted entrepreneurs carry a verified badge across NaWeHub. Only vet profiles you've checked."
        confirmLabel="Mark as vetted"
        pending={vet.isPending}
        onConfirm={() => vet.mutate(undefined, { onSuccess: () => setDialog(null) })}
      />
      <ConfirmDialog
        open={dialog === "feature"}
        onOpenChange={(open) => setDialog(open ? "feature" : null)}
        title={`Feature ${e.firstName}?`}
        description="Featured entrepreneurs are highlighted on the public site and in the portal."
        confirmLabel="Feature"
        pending={feature.isPending}
        onConfirm={() => feature.mutate(undefined, { onSuccess: () => setDialog(null) })}
      />
    </>
  );
}

export default function EntrepreneurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="entrepreneurs" label="Entrepreneurs">
      <div className="mx-auto max-w-6xl"><EntrepreneurDetail id={id} /></div>
    </RequireArea>
  );
}
