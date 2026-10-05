"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Lock, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/data/detail";
import { IDEA_STAGES, QUESTION_TYPE_LABEL } from "@/components/competitions/labels";
import type { Competition, CompetitionInput, CompetitionState, QuestionType } from "@/lib/api/types";
import { cn, formatEnumLabel } from "@/lib/utils";

interface CriterionRow { key: string; id?: string; name: string; description: string; weight: number }
interface QuestionRow { key: string; id?: string; prompt: string; helpText: string; type: QuestionType; options: string[]; required: boolean }
interface FormState {
  title: string; tagline: string; description: string; eligibilityRequirements: string; eligibleIdeaStages: string[];
  opensAt: string; closesAt: string; videoDeadline: string; totalFinalists: number;
  criteria: CriterionRow[]; questions: QuestionRow[];
  pitchFormat: "" | "PHYSICAL" | "VIRTUAL"; venue: string; meetingLink: string; pitchAt: string;
  prizes: { title: string; description: string }[];
}

let rowKey = 0;
const nextKey = () => `row-${++rowKey}`;

/** ISO instant <-> the value of an <input type="datetime-local"> (the admin's local time). */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function initialState(c?: Competition): FormState {
  if (!c) {
    const day = 24 * 60 * 60 * 1000;
    const at = (days: number) => toLocalInput(new Date(Date.now() + days * day).toISOString());
    return {
      title: "", tagline: "", description: "", eligibilityRequirements: "", eligibleIdeaStages: [],
      opensAt: at(1), closesAt: at(30), videoDeadline: at(45), totalFinalists: 10,
      criteria: [
        { key: nextKey(), name: "Innovation", description: "How new and unique the idea is", weight: 25 },
        { key: nextKey(), name: "Market potential", description: "Size of the opportunity and customer need", weight: 25 },
        { key: nextKey(), name: "Impact", description: "Economic, social or environmental difference it makes", weight: 25 },
        { key: nextKey(), name: "Feasibility", description: "Whether the team can actually deliver it", weight: 25 },
      ],
      questions: [],
      pitchFormat: "", venue: "", meetingLink: "", pitchAt: "",
      prizes: [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }],
    };
  }
  const prize = (rank: number) => c.prizes.find((p) => p.rank === rank);
  return {
    title: c.title, tagline: c.tagline ?? "", description: c.description, eligibilityRequirements: c.eligibilityRequirements,
    eligibleIdeaStages: c.eligibleIdeaStages,
    opensAt: toLocalInput(c.applicationOpensAt), closesAt: toLocalInput(c.applicationClosesAt),
    videoDeadline: toLocalInput(c.pitchVideoDeadline), totalFinalists: c.totalFinalists,
    criteria: c.evaluationCriteria.map((x) => ({ key: nextKey(), id: x.id, name: x.name, description: x.description ?? "", weight: x.weight })),
    questions: c.questions.map((q) => ({ key: nextKey(), id: q.id, prompt: q.prompt, helpText: q.helpText ?? "", type: q.type, options: q.options, required: q.required })),
    pitchFormat: c.finalPitch?.format ?? "", venue: c.finalPitch?.venue ?? "", meetingLink: c.finalPitch?.meetingLink ?? "",
    pitchAt: toLocalInput(c.finalPitch?.scheduledAt),
    prizes: [1, 2, 3].map((r) => ({ title: prize(r)?.title ?? "", description: prize(r)?.description ?? "" })),
  };
}

function toInput(s: FormState): CompetitionInput {
  return {
    title: s.title.trim(),
    tagline: s.tagline.trim() || undefined,
    description: s.description.trim(),
    eligibilityRequirements: s.eligibilityRequirements.trim(),
    eligibleIdeaStages: s.eligibleIdeaStages,
    applicationOpensAt: fromLocalInput(s.opensAt),
    applicationClosesAt: fromLocalInput(s.closesAt),
    pitchVideoDeadline: fromLocalInput(s.videoDeadline),
    totalFinalists: s.totalFinalists,
    evaluationCriteria: s.criteria.map((c) => ({ id: c.id, name: c.name.trim(), description: c.description.trim() || undefined, weight: c.weight })),
    questions: s.questions.map((q) => ({
      id: q.id, prompt: q.prompt.trim(), helpText: q.helpText.trim() || undefined, type: q.type,
      options: q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" ? q.options.map((o) => o.trim()).filter(Boolean) : [],
      required: q.required,
    })),
    finalPitch: s.pitchFormat || s.venue.trim() || s.meetingLink.trim() || s.pitchAt
      ? {
        format: s.pitchFormat || undefined,
        venue: s.pitchFormat === "PHYSICAL" ? s.venue.trim() || undefined : undefined,
        meetingLink: s.pitchFormat === "VIRTUAL" ? s.meetingLink.trim() || undefined : undefined,
        scheduledAt: s.pitchAt ? fromLocalInput(s.pitchAt) : undefined,
      }
      : null,
    prizes: s.prizes.map((p, i) => ({ rank: i + 1, title: p.title.trim(), description: p.description.trim() || undefined })).filter((p) => p.title),
  };
}

/** What can't change at each stage - mirrors the service's rules so locked fields are greyed out up front. */
function locksFor(state: CompetitionState | undefined, opensAt: string | undefined) {
  const at = (s: CompetitionState[]) => !!state && s.includes(state);
  const started = !!opensAt && Date.now() >= Date.parse(opensAt);
  return {
    questions: !!state && state !== "DRAFT",
    stages: !!state && state !== "DRAFT",
    opensAt: (!!state && state !== "DRAFT" && started) || at(["SHORTLISTING", "PITCH_VIDEO", "FINALS"]),
    closesAt: at(["SHORTLISTING", "PITCH_VIDEO", "FINALS"]),
    criteria: at(["SHORTLISTING", "PITCH_VIDEO", "FINALS"]),
    videoDeadline: at(["FINALS"]),
    finalists: at(["FINALS"]),
  };
}

function validate(s: FormState): string | null {
  if (s.title.trim().length < 5) return "Give the competition a title of at least 5 characters.";
  if (s.description.trim().length < 20) return "The description needs at least 20 characters.";
  if (s.eligibilityRequirements.trim().length < 10) return "Describe who can enter (at least 10 characters).";
  if (!s.opensAt || !s.closesAt || !s.videoDeadline) return "Set the opening date, application deadline and pitch video deadline.";
  if (Date.parse(s.opensAt) >= Date.parse(s.closesAt)) return "Applications must open before the deadline.";
  if (Date.parse(s.closesAt) >= Date.parse(s.videoDeadline)) return "The pitch video deadline must be after the application deadline.";
  if (s.totalFinalists < 3) return "At least 3 finalists are needed to declare 3 winners.";
  if (s.criteria.length === 0) return "Add at least one evaluation criterion.";
  if (s.criteria.some((c) => !c.name.trim())) return "Every evaluation criterion needs a name.";
  if (s.questions.some((q) => q.prompt.trim().length < 3)) return "Every question needs a prompt.";
  if (s.questions.some((q) => (q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && q.options.filter((o) => o.trim()).length < 2))
    return "Choice questions need at least 2 options.";
  if (s.pitchAt && Date.parse(s.pitchAt) <= Date.parse(s.videoDeadline)) return "The live final must be after the pitch video deadline.";
  return null;
}

function LockNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Lock className="size-3.5 shrink-0" /> {children}
    </p>
  );
}

export function CompetitionForm({ competition, pending, onSubmit, submitLabel }: {
  competition?: Competition;
  pending: boolean;
  onSubmit: (input: CompetitionInput) => void;
  submitLabel: string;
}) {
  const [s, setS] = useState<FormState>(() => initialState(competition));
  const [error, setError] = useState<string | null>(null);
  const lock = locksFor(competition?.state, competition?.applicationOpensAt);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const totalWeight = s.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  function updateCriterion(key: string, patch: Partial<CriterionRow>) {
    set("criteria", s.criteria.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
  function updateQuestion(key: string, patch: Partial<QuestionRow>) {
    set("questions", s.questions.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }
  function moveQuestion(index: number, by: number) {
    const next = [...s.questions];
    const [q] = next.splice(index, 1);
    next.splice(index + by, 0, q);
    set("questions", next);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const problem = validate(s);
        setError(problem);
        if (!problem) onSubmit(toInput(s));
      }}
    >
      <Section title="Profile" index={0}>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={s.title} onChange={(e) => set("title", e.target.value)} maxLength={150} placeholder="Next Big Idea 2027" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-tagline">Tagline <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="c-tagline" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={200} placeholder="Pitch the idea that changes Sierra Leone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={5} value={s.description} onChange={(e) => set("description", e.target.value)} maxLength={10000}
              placeholder="What the competition is about, who's behind it and what entrants can expect." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-elig">Eligibility requirements</Label>
            <Textarea id="c-elig" rows={3} value={s.eligibilityRequirements} onChange={(e) => set("eligibilityRequirements", e.target.value)} maxLength={5000}
              placeholder="Who can enter - age, location, stage of the business…" />
          </div>
          <div className="space-y-1.5">
            <Label>Ideas at these stages can enter <span className="text-muted-foreground">(none selected = any stage)</span></Label>
            {lock.stages && <LockNote>Fixed once the competition is published.</LockNote>}
            <div className="flex flex-wrap gap-2">
              {IDEA_STAGES.map((stage) => {
                const on = s.eligibleIdeaStages.includes(stage);
                return (
                  <button
                    key={stage} type="button" disabled={lock.stages} aria-pressed={on}
                    onClick={() => set("eligibleIdeaStages", on ? s.eligibleIdeaStages.filter((x) => x !== stage) : [...s.eligibleIdeaStages, stage])}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      on ? "border-primary-400 bg-primary-500/10 text-primary-700 dark:text-primary-300" : "border-border hover:bg-muted")}
                  >
                    {formatEnumLabel(stage)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Dates & finalists" index={1}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-opens">Applications open</Label>
            <Input id="c-opens" type="datetime-local" value={s.opensAt} disabled={lock.opensAt} onChange={(e) => set("opensAt", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-closes">Application deadline</Label>
            <Input id="c-closes" type="datetime-local" value={s.closesAt} disabled={lock.closesAt} onChange={(e) => set("closesAt", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-video">Pitch video deadline</Label>
            <Input id="c-video" type="datetime-local" value={s.videoDeadline} disabled={lock.videoDeadline} onChange={(e) => set("videoDeadline", e.target.value)} />
            <p className="text-xs text-muted-foreground">Shortlisted entrepreneurs send a 3-minute video by then.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-finalists">Number of finalists</Label>
            <Input id="c-finalists" type="number" min={3} max={100} value={s.totalFinalists} disabled={lock.finalists}
              onChange={(e) => set("totalFinalists", Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">How many advance to the live final. At least 3 - three winners are declared.</p>
          </div>
        </div>
      </Section>

      <Section title="Evaluation criteria" index={2}>
        {lock.criteria && <LockNote>Fixed once shortlisting starts, so every application is scored the same way.</LockNote>}
        <p className="mb-3 text-sm text-muted-foreground">
          Judges score each criterion from 0 to 10; the weights decide how much each counts towards the total out of 100.
        </p>
        <ul className="space-y-3">
          {s.criteria.map((c) => (
            <li key={c.key} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_6rem_auto]">
              <Input aria-label="Criterion name" value={c.name} disabled={lock.criteria} maxLength={100} placeholder="Criterion"
                onChange={(e) => updateCriterion(c.key, { name: e.target.value })} />
              <div className="flex items-center gap-1.5">
                <Input aria-label="Weight" type="number" min={1} max={100} value={c.weight} disabled={lock.criteria}
                  onChange={(e) => updateCriterion(c.key, { weight: Number(e.target.value) })} />
                <span className="text-xs text-muted-foreground">{totalWeight ? Math.round((c.weight / totalWeight) * 100) : 0}%</span>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove criterion" disabled={lock.criteria || s.criteria.length === 1}
                onClick={() => set("criteria", s.criteria.filter((x) => x.key !== c.key))}>
                <Trash2 className="size-4 text-error" />
              </Button>
              <Input aria-label="Criterion description" className="sm:col-span-3" value={c.description} disabled={lock.criteria} maxLength={500}
                placeholder="What judges should look for (optional)" onChange={(e) => updateCriterion(c.key, { description: e.target.value })} />
            </li>
          ))}
        </ul>
        {!lock.criteria && s.criteria.length < 15 && (
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => set("criteria", [...s.criteria, { key: nextKey(), name: "", description: "", weight: 10 }])}>
            <Plus className="size-4" /> Add criterion
          </Button>
        )}
      </Section>

      <Section title="Application questions" index={3}>
        {lock.questions && <LockNote>Fixed once the competition is published - applicants may already have answered.</LockNote>}
        <p className="mb-3 text-sm text-muted-foreground">
          Every application already includes the chosen idea, why it has potential, expected impact, support needed and a pitch deck.
          Add anything else this competition needs to know.
        </p>
        {s.questions.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No extra questions.</p>}
        <ul className="space-y-3">
          {s.questions.map((q, i) => (
            <li key={q.key} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                <Input aria-label="Question" value={q.prompt} disabled={lock.questions} maxLength={300} placeholder="Question"
                  onChange={(e) => updateQuestion(q.key, { prompt: e.target.value })} />
                <div className="w-44 shrink-0">
                  <Select value={q.type} disabled={lock.questions}
                    onValueChange={(v) => updateQuestion(q.key, { type: v as QuestionType, options: v === "SINGLE_CHOICE" || v === "MULTIPLE_CHOICE" ? (q.options.length ? q.options : ["", ""]) : [] })}>
                    <SelectTrigger aria-label="Answer type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => <SelectItem key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pl-8">
                <Input aria-label="Help text" value={q.helpText} disabled={lock.questions} maxLength={500} placeholder="Help text (optional)"
                  onChange={(e) => updateQuestion(q.key, { helpText: e.target.value })} />
                {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className={cn("size-3.5 shrink-0 border border-muted-foreground", q.type === "SINGLE_CHOICE" ? "rounded-full" : "rounded-sm")} />
                        <Input aria-label={`Option ${oi + 1}`} value={o} disabled={lock.questions} maxLength={150} placeholder={`Option ${oi + 1}`}
                          onChange={(e) => updateQuestion(q.key, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} />
                        <Button type="button" variant="ghost" size="icon" aria-label="Remove option" disabled={lock.questions || q.options.length <= 2}
                          onClick={() => updateQuestion(q.key, { options: q.options.filter((_, xi) => xi !== oi) })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    {!lock.questions && q.options.length < 20 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => updateQuestion(q.key, { options: [...q.options, ""] })}>
                        <Plus className="size-3.5" /> Add option
                      </Button>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={q.required} disabled={lock.questions} onCheckedChange={(v) => updateQuestion(q.key, { required: v === true })} />
                    Required
                  </label>
                  {!lock.questions && (
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => moveQuestion(i, -1)}><ArrowUp className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === s.questions.length - 1} onClick={() => moveQuestion(i, 1)}><ArrowDown className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => set("questions", s.questions.filter((x) => x.key !== q.key))}>
                        <Trash2 className="size-4 text-error" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {!lock.questions && s.questions.length < 30 && (
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => set("questions", [...s.questions, { key: nextKey(), prompt: "", helpText: "", type: "SHORT_TEXT", options: [], required: false }])}>
            <Plus className="size-4" /> Add question
          </Button>
        )}
      </Section>

      <Section title="Live final pitch" index={4}>
        <p className="mb-3 text-sm text-muted-foreground">Can be filled in later. Finalists get these details by email; the meeting link is never shown publicly.</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {([["", "Not decided"], ["PHYSICAL", "At a venue"], ["VIRTUAL", "Online"]] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => set("pitchFormat", value)}
              className={cn("rounded-xl border p-3 text-sm transition-all", s.pitchFormat === value ? "border-primary-400 bg-primary-500/5 ring-4 ring-primary-500/10" : "border-border hover:bg-muted/50")}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {s.pitchFormat === "PHYSICAL" && (
            <div className="space-y-1.5">
              <Label htmlFor="c-venue">Venue</Label>
              <Input id="c-venue" value={s.venue} maxLength={300} onChange={(e) => set("venue", e.target.value)} placeholder="Freetown Innovation Hub" />
            </div>
          )}
          {s.pitchFormat === "VIRTUAL" && (
            <div className="space-y-1.5">
              <Label htmlFor="c-link">Meeting link</Label>
              <Input id="c-link" type="url" value={s.meetingLink} maxLength={500} onChange={(e) => set("meetingLink", e.target.value)} placeholder="https://meet.google.com/…" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="c-pitch-at">Date and time</Label>
            <Input id="c-pitch-at" type="datetime-local" value={s.pitchAt} onChange={(e) => set("pitchAt", e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Prizes" index={5}>
        <div className="space-y-3">
          {s.prizes.map((p, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[4rem_1fr_1.5fr] sm:items-center">
              <span className="text-sm font-semibold">{["1st", "2nd", "3rd"][i]}</span>
              <Input aria-label={`Prize ${i + 1} title`} value={p.title} maxLength={150} placeholder="e.g. Le 50,000 seed grant"
                onChange={(e) => set("prizes", s.prizes.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))} />
              <Input aria-label={`Prize ${i + 1} details`} value={p.description} maxLength={1000} placeholder="Details (optional)"
                onChange={(e) => set("prizes", s.prizes.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </Section>

      {error && <p role="alert" className="rounded-xl border border-error/25 bg-error/5 px-4 py-3 text-sm text-error">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {submitLabel}
        </Button>
      </div>
    </form>
  );
}
