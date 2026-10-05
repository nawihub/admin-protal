"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Ban, CheckCircle2, Download, Eye, FileText, Loader2, Play, RotateCcw, Save, Video, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { HistoryPanel } from "@/components/competitions/panels";
import { APPLICATION_STATE_LABEL, evaluationStage, ordinal } from "@/components/competitions/labels";
import { competitionsApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useDownload } from "@/lib/hooks/use-download";
import { useAdminNames } from "@/lib/queries/admin-names";
import { formatDate, timeAgo } from "@/lib/format";
import { cn, formatEnumLabel, formatFileSize } from "@/lib/utils";
import type { Competition, CompetitionApplication, ScoreSheet } from "@/lib/api/types";

const STAGE_LABEL: Record<ScoreSheet["stage"], string> = { SHORTLISTING: "Shortlisting", PITCH_VIDEO: "Pitch video", FINAL: "Live final" };

/** Plays an uploaded pitch video: fetched with the admin's token, then shown from a local URL. */
function UploadedVideo({ app }: { app: CompetitionApplication }) {
  const file = app.pitchVideo!.file!;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (url) return <video src={url} controls className="w-full rounded-xl bg-black" aria-label="Pitch video" />;
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          setUrl(URL.createObjectURL(await competitionsApi.file(app.id, file.id)));
        } finally {
          setLoading(false);
        }
      }}
      className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90"
    >
      {loading ? <Loader2 className="size-8 animate-spin" /> : <Play className="size-10" />}
      <span className="text-sm">{loading ? "Loading video…" : `Play ${file.fileName} (${formatFileSize(file.size)})`}</span>
    </button>
  );
}

function ScoreForm({ c, app, stage }: { c: Competition; app: CompetitionApplication; stage: ScoreSheet["stage"] }) {
  const { user } = usePermissions();
  const mine = app.scoreSheets.find((s) => s.stage === stage && s.scorerId === user?.id);
  const [scores, setScores] = useState<Record<string, number>>(() => mine?.scores ?? {});
  const [note, setNote] = useState(mine?.note ?? "");
  const save = useAction(
    () => competitionsApi.score(app.id, c.evaluationCriteria.map((x) => ({ criterionId: x.id, score: scores[x.id] })), note.trim() || undefined),
    { success: "Scores saved", invalidate: [["competitions"]] },
  );
  const complete = c.evaluationCriteria.every((x) => scores[x.id] !== undefined);
  const weights = c.evaluationCriteria.reduce((s, x) => s + x.weight, 0);
  const total = complete ? Math.round((c.evaluationCriteria.reduce((s, x) => s + scores[x.id] * x.weight, 0) / weights) * 100) / 10 : null;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (complete) save.mutate(); }} className="space-y-4">
      {c.evaluationCriteria.map((x) => (
        <fieldset key={x.id}>
          <legend className="flex w-full items-baseline justify-between text-sm">
            <span className="font-medium">{x.name}</span>
            <span className="text-xs text-muted-foreground">{Math.round((x.weight / weights) * 100)}%</span>
          </legend>
          {x.description && <p className="text-xs text-muted-foreground">{x.description}</p>}
          <div className="mt-1.5 grid grid-cols-11 gap-1" role="radiogroup" aria-label={`${x.name} score`}>
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n} type="button" role="radio" aria-checked={scores[x.id] === n}
                onClick={() => setScores({ ...scores, [x.id]: n })}
                className={cn("h-8 rounded-md border text-xs font-medium tabular-nums transition-colors",
                  scores[x.id] === n ? "border-primary-500 bg-primary-500 text-white" : "border-border hover:bg-muted")}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="score-note">Notes for the panel <span className="text-muted-foreground">(admins only)</span></Label>
        <Textarea id="score-note" rows={3} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{total != null ? <>Your total: <strong className="tabular-nums">{total}</strong>/100</> : <span className="text-muted-foreground">Score every criterion</span>}</span>
        <Button type="submit" disabled={!complete || save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {mine ? "Update scores" : "Save scores"}
        </Button>
      </div>
    </form>
  );
}

function DecisionPanel({ app, stage }: { app: CompetitionApplication; stage: "SHORTLISTING" | "PITCH_VIDEO" }) {
  const [note, setNote] = useState(app.decisionNote ?? "");
  const decide = useAction((d: "ADVANCE" | "REJECT" | "NONE") => competitionsApi.decide(app.id, d, d === "REJECT" ? note.trim() || undefined : undefined), {
    success: (r) => r.pendingDecision === "ADVANCE" ? `Marked to ${stage === "SHORTLISTING" ? "shortlist" : "make a finalist"}`
      : r.pendingDecision === "REJECT" ? "Marked to reject" : "Decision cleared",
    invalidate: [["competitions"]],
  });
  const noVideo = stage === "PITCH_VIDEO" && !app.pitchVideo;
  const advanceLabel = stage === "SHORTLISTING" ? "Shortlist" : "Make finalist";
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Decisions stay private until you announce the {stage === "SHORTLISTING" ? "shortlist" : "finalists"} from the competition page, so you can change your mind until then.
      </p>
      {app.pendingDecision && (
        <p className={cn("rounded-xl px-3 py-2 text-sm font-medium", app.pendingDecision === "ADVANCE" ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
          Marked to {app.pendingDecision === "ADVANCE" ? advanceLabel.toLowerCase() : "reject"}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="border-success/40 text-success hover:bg-success/10" disabled={decide.isPending || noVideo}
          onClick={() => decide.mutate("ADVANCE")}>
          <CheckCircle2 className="size-4" /> {advanceLabel}
        </Button>
        <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" disabled={decide.isPending} onClick={() => decide.mutate("REJECT")}>
          <XCircle className="size-4" /> Reject
        </Button>
        {app.pendingDecision && (
          <Button variant="ghost" disabled={decide.isPending} onClick={() => decide.mutate("NONE")}><RotateCcw className="size-4" /> Clear</Button>
        )}
      </div>
      {noVideo && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ban className="size-3.5" /> No pitch video yet - only entrepreneurs who sent one can become finalists.</p>}
      <div className="space-y-1.5">
        <Label htmlFor="decision-note">Feedback if rejected <span className="text-muted-foreground">(emailed to the entrepreneur)</span></Label>
        <Textarea id="decision-note" rows={3} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)}
          placeholder="What would make the idea stronger next time?" />
      </div>
    </div>
  );
}

function ApplicationReview({ appId }: { appId: string }) {
  const { canManage } = usePermissions();
  const manage = canManage("bigIdeas");
  const names = useAdminNames();
  const { busy, download } = useDownload();
  const { data: app, isLoading, isError } = useQuery({ queryKey: ["competitions", "application", appId], queryFn: () => competitionsApi.application(appId) });
  const { data: c } = useQuery({
    queryKey: ["competitions", "detail", app?.competitionId],
    queryFn: () => competitionsApi.get(app!.competitionId),
    enabled: !!app,
  });

  if (isLoading || (app && !c)) return <DetailSkeleton />;
  if (isError || !app || !c) return <p className="py-20 text-center text-muted-foreground">This application couldn&apos;t be found.</p>;

  const stage = evaluationStage(c.state);
  const inPlay = stage && app.state === stage.applicationState;
  const label = app.winnerRank ? `${ordinal(app.winnerRank)} place` : APPLICATION_STATE_LABEL[app.state];
  const sheetsByStage = (["SHORTLISTING", "PITCH_VIDEO", "FINAL"] as const)
    .map((s) => ({ stage: s, sheets: app.scoreSheets.filter((x) => x.stage === s) }))
    .filter((g) => g.sheets.length > 0);

  return (
    <>
      <BackLink href={`/competitions/${c.id}`} label={c.title} />
      <DetailHeader
        icon={<span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-300 to-primary-500 font-display text-xl font-bold text-white shadow-lg">{app.idea.ideaName.charAt(0)}</span>}
        status={<><StatusBadge status={app.state} label={label} />{app.idea.stage && <Tag>{formatEnumLabel(app.idea.stage)}</Tag>}</>}
        title={app.idea.ideaName}
        subtitle={app.idea.oneLineDescription ?? undefined}
        meta={<><span>{app.idea.applicantName}{app.idea.applicantLocation && ` · ${app.idea.applicantLocation}`}</span><span>{app.submitTime ? `Submitted ${formatDate(app.submitTime, true)}` : "Not submitted"}</span></>}
        actions={<Button variant="outline" asChild><Link href={`/big-ideas/${app.ideaId}`}>Full idea <ArrowUpRight className="size-4" /></Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Why it has potential" index={0}>
            <FieldGrid>
              <Field label="Potential" full>{app.potentialStatement}</Field>
              <Field label="Expected impact" full>{app.expectedImpact}</Field>
              <Field label="Support needed" full>{app.supportNeeded}</Field>
            </FieldGrid>
          </Section>

          {c.questions.length > 0 && (
            <Section title="Competition questions" index={1}>
              <dl className="space-y-4">
                {c.questions.map((q) => {
                  const a = app.answers.find((x) => x.questionId === q.id);
                  const value = a?.text ?? (a?.choices.length ? a.choices.map((x) => (x === "YES" ? "Yes" : x === "NO" ? "No" : x)).join(", ") : null);
                  return (
                    <div key={q.id}>
                      <dt className="text-sm font-medium">{q.prompt}</dt>
                      <dd className={cn("mt-0.5 whitespace-pre-line text-sm", !value && "text-muted-foreground")}>{value ?? "Not answered"}</dd>
                    </div>
                  );
                })}
              </dl>
            </Section>
          )}

          <Section title="Pitch deck" index={2}>
            {app.pitchDeck ? (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <FileText className="size-8 shrink-0 text-primary-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{app.pitchDeck.fileName}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(app.pitchDeck.size)} · {formatDate(app.pitchDeck.uploadedAt)}</span>
                </span>
                <Button variant="ghost" size="icon" aria-label="Preview deck" disabled={busy !== null}
                  onClick={() => download("deck-open", () => competitionsApi.file(app.id, app.pitchDeck!.id), app.pitchDeck!.fileName, "open")}>
                  <Eye className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Download deck" disabled={busy !== null}
                  onClick={() => download("deck", () => competitionsApi.file(app.id, app.pitchDeck!.id), app.pitchDeck!.fileName)}>
                  {busy === "deck" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                </Button>
              </div>
            ) : <p className="text-sm text-muted-foreground">No deck uploaded.</p>}
          </Section>

          {(app.pitchVideo || ["SHORTLISTED", "FINALIST", "NOT_ADVANCED", "WINNER"].includes(app.state)) && (
            <Section title="Pitch video" index={3}>
              {!app.pitchVideo ? <p className="text-sm text-muted-foreground">Not sent yet{c.state === "PITCH_VIDEO" && ` - due ${formatDate(c.pitchVideoDeadline, true)}`}.</p>
                : app.pitchVideo.link ? (
                  <a href={app.pitchVideo.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
                    <Video className="size-8 shrink-0 text-primary-500" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{app.pitchVideo.link}</span>
                      <span className="text-xs text-muted-foreground">Sent {timeAgo(app.pitchVideo.submittedAt)}</span></span>
                    <ArrowUpRight className="size-4" />
                  </a>
                ) : app.pitchVideo.file ? <UploadedVideo app={app} />
                  : <p className="text-sm text-muted-foreground">The uploaded video was removed from storage after the competition ended.</p>}
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {manage && inPlay && (
            <Section title={`Score - ${stage.label}`} index={4}>
              <ScoreForm key={stage.stage} c={c} app={app} stage={stage.stage} />
            </Section>
          )}
          {manage && inPlay && stage.stage !== "FINAL" && (
            <Section title="Decision" index={5}>
              <DecisionPanel key={app.pendingDecision ?? "none"} app={app} stage={stage.stage} />
            </Section>
          )}
          <Section title="Judges' scores" index={6}>
            {sheetsByStage.length === 0 ? <p className="text-sm text-muted-foreground">Not scored yet.</p> : (
              <div className="space-y-4">
                {sheetsByStage.map((g) => {
                  const avg = Math.round((g.sheets.reduce((s, x) => s + x.total, 0) / g.sheets.length) * 10) / 10;
                  return (
                    <div key={g.stage}>
                      <p className="mb-1.5 flex items-baseline justify-between text-sm font-medium">{STAGE_LABEL[g.stage]}<span className="tabular-nums">{avg}/100</span></p>
                      <ul className="space-y-2">
                        {g.sheets.map((s) => (
                          <li key={s.scorerId} className="rounded-xl bg-muted/50 p-2.5 text-sm">
                            <p className="flex justify-between"><span>{s.scorerName || names(s.scorerId)}</span><span className="tabular-nums font-medium">{s.total}</span></p>
                            <p className="text-xs text-muted-foreground">
                              {c.evaluationCriteria.map((x) => `${x.name} ${s.scores[x.id] ?? "-"}`).join(" · ")}
                            </p>
                            {s.note && <p className="mt-1 whitespace-pre-line text-xs">{s.note}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
          {app.decisionNote && !inPlay && (
            <Section title="Feedback sent" index={7}><p className="whitespace-pre-line text-sm">{app.decisionNote}</p></Section>
          )}
          <Section title="History" index={8}><HistoryPanel id={c.id} applicationId={app.id} names={names} /></Section>
        </div>
      </div>
    </>
  );
}

export default function ApplicationPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  return (
    <RequireArea area="bigIdeas" label="Competitions">
      <div className="mx-auto max-w-6xl"><ApplicationReview appId={appId} /></div>
    </RequireArea>
  );
}
