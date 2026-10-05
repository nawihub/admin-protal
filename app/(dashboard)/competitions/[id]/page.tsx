"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Crown, Megaphone, Pencil, Rocket, Send, Trash2, Trophy, Video, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ConfirmDialog, ReasonDialog } from "@/components/data/action-dialogs";
import { DataTable, type Column } from "@/components/data/data-table";
import { Segments } from "@/components/data/filters";
import { StageStepper } from "@/components/competitions/stage-stepper";
import { HistoryPanel, ResultsPanel, SettingsPanel, WinnersDialog } from "@/components/competitions/panels";
import { APPLICATION_STATE_LABEL, competitionPhaseLabel, evaluationStage, ordinal } from "@/components/competitions/labels";
import { competitionsApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useNow } from "@/lib/hooks/use-now";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useAdminNames } from "@/lib/queries/admin-names";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { formatDate, timeAgo } from "@/lib/format";
import type { Competition, CompetitionApplication, ScoreSheet } from "@/lib/api/types";

type Dialog = "publish" | "close" | "shortlist" | "finalists" | "winners" | "cancel" | "delete" | null;

/** The stage whose scores the table shows: the current one, the final once completed, else shortlisting. */
function scoreStage(c: Competition): ScoreSheet["stage"] {
  return evaluationStage(c.state)?.stage ?? (c.state === "COMPLETED" ? "FINAL" : "SHORTLISTING");
}

const SCORE_HEADER: Record<ScoreSheet["stage"], string> = { SHORTLISTING: "Shortlisting score", PITCH_VIDEO: "Pitch video score", FINAL: "Final score" };

function scoreFor(a: CompetitionApplication, stage: ScoreSheet["stage"]) {
  return stage === "SHORTLISTING" ? a.shortlistingScore : stage === "PITCH_VIDEO" ? a.pitchVideoScore : a.finalScore;
}

/** @param rankOf when set, a leading "#" column with each row's rank */
function columns(c: Competition, rankOf?: (a: CompetitionApplication) => number): Column<CompetitionApplication>[] {
  const stage = evaluationStage(c.state);
  return [
    ...(rankOf ? [{ key: "rank", header: "#", cell: (a: CompetitionApplication) => <span className="font-semibold tabular-nums text-muted-foreground">{rankOf(a)}</span> }] : []),
    {
      key: "idea",
      header: "Idea",
      cell: (a) => (
        <div className="min-w-[14rem]">
          <p className="truncate font-medium">{a.idea.ideaName}</p>
          <p className="truncate text-xs text-muted-foreground">{a.idea.applicantName}{a.idea.applicantLocation && ` · ${a.idea.applicantLocation}`}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: SCORE_HEADER[scoreStage(c)],
      cell: (a) => {
        const scored = scoreStage(c);
        const score = scoreFor(a, scored);
        const sheets = a.scoreSheets.filter((s) => s.stage === scored).length;
        return score != null || sheets > 0
          ? <span className="whitespace-nowrap"><span className="font-semibold tabular-nums">{score ?? 0}</span><span className="text-xs text-muted-foreground"> /100 · {sheets} judge{sheets === 1 ? "" : "s"}</span></span>
          : <span className="text-xs text-muted-foreground">Not scored</span>;
      },
    },
    ...(stage && stage.stage !== "FINAL" ? [{
      key: "decision",
      header: "Decision",
      cell: (a: CompetitionApplication) => a.pendingDecision === "ADVANCE" ? <Tag tone="success">Advance</Tag>
        : a.pendingDecision === "REJECT" ? <Tag tone="error">Reject</Tag>
          : a.state === stage.applicationState ? <Tag tone="warning">Undecided</Tag> : null,
    } as Column<CompetitionApplication>] : []),
    {
      key: "video",
      header: "Video",
      hideBelow: "md",
      cell: (a) => a.pitchVideo ? <Video className="size-4 text-primary-500" aria-label="Pitch video sent" /> : <span className="text-xs text-muted-foreground">-</span>,
    },
    { key: "state", header: "Status", cell: (a) => <StatusBadge status={a.state} label={a.winnerRank ? `${ordinal(a.winnerRank)} place` : APPLICATION_STATE_LABEL[a.state]} /> },
    { key: "submitted", header: "Submitted", hideBelow: "lg", cell: (a) => <span className="whitespace-nowrap text-xs text-muted-foreground">{a.submitTime ? timeAgo(a.submitTime) : "Draft"}</span> },
  ];
}

function Applications({ c }: { c: Competition }) {
  const router = useRouter();
  const stage = evaluationStage(c.state);
  const { values, update } = useUrlState(["apps"] as const);
  const filter = values.apps || (stage ? "STAGE" : "ALL");
  const states = filter === "STAGE" && stage ? [stage.applicationState]
    : filter === "ALL" ? ["SUBMITTED", "SHORTLISTED", "NOT_SHORTLISTED", "FINALIST", "NOT_ADVANCED", "WINNER"]
      : [filter];
  const ranked = filter === "STAGE" || (filter === "ALL" && c.state === "COMPLETED");
  const list = useCursorList(["competitions", "applications", c.id, filter], (pageToken) =>
    competitionsApi.applications(c.id, { pageSize: 50, pageToken, state: states, order: ranked ? "score" : undefined }),
  );
  const cols = columns(c, ranked ? (a) => list.items.indexOf(a) + 1 : undefined);

  return (
    <>
      <div className="mb-4">
        <Segments
          value={filter}
          onChange={(v) => update({ apps: v })}
          segments={[
            ...(stage ? [{ value: "STAGE", label: `In ${stage.label.toLowerCase()}` }] : []),
            { value: "ALL", label: "All entries" },
            { value: "DRAFT", label: "Unsubmitted drafts" },
            { value: "WITHDRAWN", label: "Withdrawn" },
          ]}
        />
      </div>
      <DataTable
        columns={cols}
        rows={list.items}
        getKey={(a) => a.id}
        onRowClick={(a) => router.push(`/competitions/applications/${a.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No applications here", description: c.state === "DRAFT" ? "Publish the competition to open applications." : "Nothing in this view yet." }}
      />
    </>
  );
}

/** What the current stage needs before it can be announced, from the applications in play. */
function StageProgress({ c, inPlay, now }: { c: Competition; inPlay: CompetitionApplication[] | undefined; now: number }) {
  const stage = evaluationStage(c.state);
  let text: React.ReactNode = null;
  if (c.state === "DRAFT") text = "Draft - only admins can see it. Publish it to open applications.";
  else if (c.state === "PUBLISHED") {
    text = now < Date.parse(c.applicationOpensAt) ? `Published - applications open ${formatDate(c.applicationOpensAt, true)}.`
      : now < Date.parse(c.applicationClosesAt) ? `Open for applications until ${formatDate(c.applicationClosesAt, true)} · ${c.stats.submitted} submitted so far.`
        : "The deadline has passed - applications close automatically within a minute, or close them now.";
  } else if (stage && inPlay) {
    const undecided = inPlay.filter((a) => !a.pendingDecision).length;
    const advancing = inPlay.filter((a) => a.pendingDecision === "ADVANCE").length;
    const unscored = inPlay.filter((a) => !a.scoreSheets.some((s) => s.stage === stage.stage)).length;
    if (stage.stage === "FINAL") text = `${inPlay.length} finalists · ${unscored} still to be scored for the live final. Declare the three winners when the panel has decided.`;
    else {
      const limit = stage.stage === "PITCH_VIDEO" ? ` (3-${c.totalFinalists} allowed)` : " (at least 3)";
      const videos = stage.stage === "PITCH_VIDEO" ? ` · ${inPlay.filter((a) => a.pitchVideo).length}/${inPlay.length} sent a video (due ${formatDate(c.pitchVideoDeadline, true)})` : "";
      text = <>{inPlay.length} in play · {unscored} unscored · {undecided} undecided · <strong>{advancing} to advance</strong>{limit}{videos}. Nothing reaches entrants until you announce.</>;
    }
  } else if (c.state === "COMPLETED") text = `Completed ${formatDate(c.stateTime)}.${c.pitchVideosPurged ? " Uploaded pitch videos have been removed from storage." : " Uploaded pitch videos are removed from storage shortly after the end."}`;
  else if (c.state === "CANCELLED") text = <>Cancelled {formatDate(c.stateTime)}{c.cancelReason && <> - {c.cancelReason}</>}</>;
  return text ? <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-sm">{text}</p> : null;
}

function CompetitionDetail({ id }: { id: string }) {
  const router = useRouter();
  const { canManage } = usePermissions();
  const manage = canManage("bigIdeas");
  const names = useAdminNames();
  const { values, update } = useUrlState(["tab"] as const);
  const [dialog, setDialog] = useState<Dialog>(null);
  const now = useNow();
  const { data: c, isLoading, isError } = useQuery({ queryKey: ["competitions", "detail", id], queryFn: () => competitionsApi.get(id) });
  const stage = c ? evaluationStage(c.state) : null;
  const inPlay = useQuery({
    queryKey: ["competitions", "applications", id, "in-play", stage?.applicationState],
    queryFn: () => competitionsApi.applications(id, { pageSize: 200, state: [stage!.applicationState], order: "score" }),
    enabled: !!stage,
  });

  const invalidate = [["competitions"]] as const;
  const close = () => setDialog(null);
  const publish = useAction(() => competitionsApi.publish(id), { success: "Published - it's now on the Next Big Idea page", invalidate });
  const startShortlisting = useAction(() => competitionsApi.startShortlisting(id), { success: "Applications closed - shortlisting has started", invalidate });
  const announceShortlist = useAction(() => competitionsApi.announceShortlist(id), { success: "Shortlist announced - entrants are being emailed", invalidate });
  const announceFinalists = useAction(() => competitionsApi.announceFinalists(id), { success: "Finalists announced - entrants are being emailed", invalidate });
  const declareWinners = useAction((ids: string[]) => competitionsApi.declareWinners(id, ids), { success: "Winners declared!", invalidate });
  const cancel = useAction((reason: string) => competitionsApi.cancel(id, reason), { success: "Competition cancelled", invalidate });
  const remove = useAction(() => competitionsApi.remove(id), { success: "Draft deleted", invalidate });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !c) return <p className="py-20 text-center text-muted-foreground">This competition couldn&apos;t be found.</p>;

  const pastDeadline = now >= Date.parse(c.applicationClosesAt);
  const ended = c.state === "COMPLETED" || c.state === "CANCELLED";
  const apps = inPlay.data?.items;
  const advancing = apps?.filter((a) => a.pendingDecision === "ADVANCE").length ?? 0;
  const rejecting = apps?.filter((a) => a.pendingDecision === "REJECT").length ?? 0;

  const primary = manage && (
    c.state === "DRAFT" ? <Button onClick={() => setDialog("publish")}><Rocket className="size-4" /> Publish</Button>
      : c.state === "PUBLISHED" && pastDeadline ? <Button onClick={() => setDialog("close")}><CheckCircle2 className="size-4" /> Close applications</Button>
        : c.state === "SHORTLISTING" ? <Button onClick={() => setDialog("shortlist")}><Megaphone className="size-4" /> Announce shortlist</Button>
          : c.state === "PITCH_VIDEO" ? <Button onClick={() => setDialog("finalists")}><Send className="size-4" /> Announce finalists</Button>
            : c.state === "FINALS" ? <Button onClick={() => setDialog("winners")}><Crown className="size-4" /> Declare winners</Button>
              : null
  );
  const actions = manage && (
    <>
      {primary}
      {!ended && <Button variant="outline" asChild><Link href={`/competitions/${id}/edit`}><Pencil className="size-4" /> Edit</Link></Button>}
      {!ended && c.state !== "DRAFT" && (
        <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("cancel")}><XCircle className="size-4" /> Cancel</Button>
      )}
      {c.state === "DRAFT" && <Button variant="ghost" size="icon" aria-label="Delete draft" onClick={() => setDialog("delete")}><Trash2 className="size-4 text-error" /></Button>}
    </>
  );

  return (
    <>
      <BackLink href="/competitions" label="Competitions" />
      <DetailHeader
        icon={<span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-400 to-primary-600 text-white shadow-lg"><Trophy className="size-7" /></span>}
        status={<><StatusBadge status={c.state} label={competitionPhaseLabel(c, now)} /><Tag>{c.totalFinalists} finalists</Tag></>}
        title={c.title}
        subtitle={c.tagline ?? undefined}
        meta={<><span>Applications {formatDate(c.applicationOpensAt)} - {formatDate(c.applicationClosesAt)}</span><span>Created by {names(c.createdBy)}</span></>}
        actions={actions}
      />
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <StageStepper state={c.state} />
        <StageProgress c={c} inPlay={apps} now={now} />
      </div>

      <Tabs value={values.tab || "applications"} onValueChange={(t) => update({ tab: t })}>
        <TabsList className="mb-4">
          <TabsTrigger value="applications">Applications ({c.stats.submitted})</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="applications"><Suspense><Applications c={c} /></Suspense></TabsContent>
        <TabsContent value="results"><ResultsPanel id={id} /></TabsContent>
        <TabsContent value="settings"><SettingsPanel c={c} /></TabsContent>
        <TabsContent value="history"><div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><HistoryPanel id={id} names={names} /></div></TabsContent>
      </Tabs>

      <ConfirmDialog
        open={dialog === "publish"} onOpenChange={(o) => setDialog(o ? "publish" : null)}
        title="Publish this competition?"
        description={<>It appears on the Next Big Idea page, and entrepreneurs can apply from {formatDate(c.applicationOpensAt, true)} until {formatDate(c.applicationClosesAt, true)}. The application questions and eligible idea stages can&apos;t change after this.</>}
        confirmLabel="Publish" pending={publish.isPending} onConfirm={() => publish.mutate(undefined, { onSuccess: close })}
      />
      <ConfirmDialog
        open={dialog === "close"} onOpenChange={(o) => setDialog(o ? "close" : null)}
        title="Close applications and start shortlisting?"
        description="Unsubmitted drafts stay out. You can then score and decide on every submitted application."
        confirmLabel="Close applications" pending={startShortlisting.isPending} onConfirm={() => startShortlisting.mutate(undefined, { onSuccess: close })}
      />
      <ConfirmDialog
        open={dialog === "shortlist"} onOpenChange={(o) => setDialog(o ? "shortlist" : null)}
        title="Announce the shortlist?"
        description={<>{advancing} will be shortlisted and asked for a pitch video by {formatDate(c.pitchVideoDeadline, true)}; {rejecting} will be told they weren&apos;t shortlisted (with your note, if any). The shortlist goes public. This can&apos;t be undone.</>}
        confirmLabel="Announce shortlist" pending={announceShortlist.isPending} onConfirm={() => announceShortlist.mutate(undefined, { onSuccess: close })}
      />
      <ConfirmDialog
        open={dialog === "finalists"} onOpenChange={(o) => setDialog(o ? "finalists" : null)}
        title="Announce the finalists?"
        description={<>{advancing} go through to the live final and get its details by email; {rejecting} will be told they didn&apos;t advance. The finalists go public. This can&apos;t be undone.</>}
        confirmLabel="Announce finalists" pending={announceFinalists.isPending} onConfirm={() => announceFinalists.mutate(undefined, { onSuccess: close })}
      />
      <WinnersDialog
        open={dialog === "winners"} onOpenChange={(o) => setDialog(o ? "winners" : null)}
        finalists={apps ?? []} pending={declareWinners.isPending}
        onConfirm={(ids) => declareWinners.mutate(ids, { onSuccess: close })}
      />
      <ReasonDialog
        open={dialog === "cancel"} onOpenChange={(o) => setDialog(o ? "cancel" : null)}
        title="Cancel this competition"
        description="Everyone with an application in progress gets this reason by email. This can't be undone."
        confirmLabel="Cancel competition" placeholder="Why is it being cancelled?"
        pending={cancel.isPending} onSubmit={(reason) => cancel.mutate(reason, { onSuccess: close })}
      />
      <ConfirmDialog
        open={dialog === "delete"} onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title="Delete this draft?" description="It was never published, so nobody has applied. This can't be undone."
        confirmLabel="Delete draft" destructive pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.replace("/competitions") })}
      />
    </>
  );
}

export default function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="bigIdeas" label="Competitions">
      <div className="mx-auto max-w-6xl"><Suspense><CompetitionDetail id={id} /></Suspense></div>
    </RequireArea>
  );
}
