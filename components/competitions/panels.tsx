"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarClock, Crown, History, Loader2, MapPin, Medal, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGrid, Section } from "@/components/data/detail";
import { Tag } from "@/components/data/status-badge";
import { APPLICATION_STATE_LABEL, QUESTION_TYPE_LABEL, eventLabel, ordinal } from "@/components/competitions/labels";
import { competitionsApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { formatDate, timeAgo } from "@/lib/format";
import { formatEnumLabel } from "@/lib/utils";
import type { Competition, CompetitionApplication, CompetitionEntrant } from "@/lib/api/types";

// ─── Settings ────────────────────────────────────────────────────────────────

export function SettingsPanel({ c }: { c: Competition }) {
  const weights = c.evaluationCriteria.reduce((s, x) => s + x.weight, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="About" index={0}>
          <p className="whitespace-pre-line text-sm leading-relaxed">{c.description}</p>
        </Section>
        <Section title="Eligibility" index={1}>
          <p className="whitespace-pre-line text-sm leading-relaxed">{c.eligibilityRequirements}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.eligibleIdeaStages.length === 0 ? <Tag>Ideas at any stage</Tag> : c.eligibleIdeaStages.map((s) => <Tag key={s}>{formatEnumLabel(s)}</Tag>)}
          </div>
        </Section>
        <Section title={`Application questions (${c.questions.length})`} index={2}>
          <p className="mb-3 text-sm text-muted-foreground">Asked on top of the standard fields: the idea, why it has potential, expected impact, support needed and a pitch deck.</p>
          {c.questions.length === 0 ? <p className="text-sm text-muted-foreground">No extra questions.</p> : (
            <ol className="space-y-3">
              {c.questions.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">{i + 1}. {q.prompt}{q.required && <span className="text-error"> *</span>}</p>
                  {q.helpText && <p className="mt-0.5 text-xs text-muted-foreground">{q.helpText}</p>}
                  <p className="mt-1.5 text-xs text-muted-foreground">{QUESTION_TYPE_LABEL[q.type]}{q.options.length > 0 && `: ${q.options.join(" · ")}`}</p>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
      <div className="space-y-6">
        <Section title="Timeline" index={3}>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span>Applications open<br /><span className="text-muted-foreground">{formatDate(c.applicationOpensAt, true)}</span></span></li>
            <li className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span>Application deadline<br /><span className="text-muted-foreground">{formatDate(c.applicationClosesAt, true)}</span></span></li>
            <li className="flex gap-2"><Video className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span>Pitch video deadline<br /><span className="text-muted-foreground">{formatDate(c.pitchVideoDeadline, true)}</span></span></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>Live final{c.finalPitch?.format && ` · ${c.finalPitch.format === "PHYSICAL" ? "at a venue" : "online"}`}<br />
                <span className="text-muted-foreground">
                  {c.finalPitch?.scheduledAt ? formatDate(c.finalPitch.scheduledAt, true) : "Date to be decided"}
                  {c.finalPitch?.venue && <><br />{c.finalPitch.venue}</>}
                  {c.finalPitch?.meetingLink && <><br /><a className="underline" href={c.finalPitch.meetingLink} target="_blank" rel="noreferrer">{c.finalPitch.meetingLink}</a></>}
                </span>
              </span>
            </li>
          </ul>
          <FieldGrid><Field label="Finalists">{String(c.totalFinalists)}</Field></FieldGrid>
        </Section>
        <Section title="Evaluation criteria" index={4}>
          <ul className="space-y-2.5">
            {c.evaluationCriteria.map((x) => (
              <li key={x.id}>
                <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-medium">{x.name}</span><span className="text-xs text-muted-foreground">{Math.round((x.weight / weights) * 100)}%</span></div>
                {x.description && <p className="text-xs text-muted-foreground">{x.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
        {c.prizes.length > 0 && (
          <Section title="Prizes" index={5}>
            <ul className="space-y-2.5">
              {c.prizes.map((p) => (
                <li key={p.rank} className="flex gap-2 text-sm">
                  <Medal className="mt-0.5 size-4 shrink-0 text-secondary-500" />
                  <span><span className="font-medium">{ordinal(p.rank)}: {p.title}</span>{p.description && <><br /><span className="text-muted-foreground">{p.description}</span></>}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

function EntrantList({ title, entrants, empty, ranked }: { title: string; entrants: CompetitionEntrant[]; empty: string; ranked?: boolean }) {
  return (
    <Section title={`${title} (${entrants.length})`}>
      {entrants.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <ul className="divide-y divide-border">
          {entrants.map((e) => (
            <li key={e.applicationId}>
              <Link href={`/competitions/applications/${e.applicationId}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/40">
                {ranked && e.winnerRank ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-500/15 text-sm font-bold text-secondary-700 dark:text-secondary-300">{e.winnerRank}</span>
                ) : <Award className="size-5 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.idea.ideaName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{e.idea.applicantName}{e.idea.applicantLocation && ` · ${e.idea.applicantLocation}`}</span>
                </span>
                <Tag>{APPLICATION_STATE_LABEL[e.state]}</Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** What the public sees on the Next Big Idea page, as announced so far. */
export function ResultsPanel({ id }: { id: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["competitions", "entrants", id], queryFn: () => competitionsApi.entrants(id) });
  if (isLoading || !data) return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <EntrantList title="Winners" entrants={data.winners} empty="Declared at the end of the live final." ranked />
      <EntrantList title="Finalists" entrants={data.finalists} empty="Announced after the pitch video stage." />
      <EntrantList title="Shortlist" entrants={data.shortlisted} empty="Announced after shortlisting." />
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

/** Events the entrepreneur triggers (their actor id is the applicant, not an admin). */
const APPLICANT_ACTIONS = new Set([
  "application.started", "application.submitted", "application.withdrawn",
  "application.deck_uploaded", "application.video_uploaded", "application.video_linked",
]);

export function HistoryPanel({ id, applicationId, names }: { id: string; applicationId?: string; names?: (actorId: string) => string }) {
  const list = useCursorList(["competitions", "events", id, applicationId], (pageToken) =>
    competitionsApi.events(id, { pageSize: 50, pageToken, applicationId }),
  );
  if (list.isLoading) return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  if (list.items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>;
  return (
    <div>
      <ol className="relative space-y-4 border-l border-border pl-5">
        {list.items.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[1.6rem] top-1 flex size-3 items-center justify-center rounded-full bg-primary-500 ring-4 ring-background" />
            <p className="text-sm font-medium">{eventLabel(e.action)}</p>
            {e.detail && <p className="text-sm text-muted-foreground">{e.detail}</p>}
            <p className="text-xs text-muted-foreground">
              {e.actorId === "system" ? "Automatic" : APPLICANT_ACTIONS.has(e.action) ? "Applicant" : names ? names(e.actorId) : "An admin"} · {timeAgo(e.createTime)}
              {!applicationId && e.applicationId && <> · <Link className="underline" href={`/competitions/applications/${e.applicationId}`}>application</Link></>}
            </p>
          </li>
        ))}
      </ol>
      {list.hasNextPage && (
        <Button variant="ghost" size="sm" className="mt-4" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
          {list.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : <History className="size-4" />} Older
        </Button>
      )}
    </div>
  );
}

// ─── Winners ─────────────────────────────────────────────────────────────────

/** Pick 1st, 2nd and 3rd from the finalists - suggested from the live final scores. */
export function WinnersDialog({ open, onOpenChange, finalists, pending, onConfirm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  finalists: CompetitionApplication[];
  pending: boolean;
  onConfirm: (ids: string[]) => void;
}) {
  const ranked = useMemo(() => [...finalists].sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1)), [finalists]);
  const [picks, setPicks] = useState<string[]>([]);
  const effective = picks.length === 3 ? picks : ranked.slice(0, 3).map((a) => a.id);
  const valid = effective.length === 3 && new Set(effective).size === 3 && effective.every(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPicks([]); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Declare the winners</DialogTitle>
          <DialogDescription>
            Exactly three winners. Pre-filled from the live final scores - change any place if the panel decided otherwise.
            Winners and finalists are emailed, and the results go public.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {[0, 1, 2].map((place) => (
            <div key={place} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <Label className="flex items-center gap-1.5"><Crown className="size-4 text-secondary-500" />{ordinal(place + 1)}</Label>
              <Select value={effective[place] ?? ""} onValueChange={(v) => { const next = [...effective]; next[place] = v; setPicks(next); }}>
                <SelectTrigger aria-label={`${ordinal(place + 1)} place`}><SelectValue placeholder="Pick a finalist" /></SelectTrigger>
                <SelectContent>
                  {ranked.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.idea.ideaName}{a.finalScore != null ? ` - ${a.finalScore}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {!valid && <p className="text-sm text-error">Pick three different finalists.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button disabled={!valid || pending} onClick={() => onConfirm(effective)}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />} Declare winners
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
