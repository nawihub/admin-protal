import type { ApplicationState, Competition, CompetitionState, QuestionType } from "@/lib/api/types";

export const COMPETITION_STATE_LABEL: Record<CompetitionState, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Open",
  SHORTLISTING: "Shortlisting",
  PITCH_VIDEO: "Pitch videos",
  FINALS: "Finals",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** A published competition's real phase depends on its dates. */
export function competitionPhaseLabel(c: Pick<Competition, "state" | "applicationOpensAt" | "applicationClosesAt">, now = Date.now()) {
  if (c.state !== "PUBLISHED") return COMPETITION_STATE_LABEL[c.state];
  if (now < Date.parse(c.applicationOpensAt)) return "Opens soon";
  if (now >= Date.parse(c.applicationClosesAt)) return "Closing";
  return "Open";
}

export const APPLICATION_STATE_LABEL: Record<ApplicationState, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  SHORTLISTED: "Shortlisted",
  NOT_SHORTLISTED: "Not shortlisted",
  FINALIST: "Finalist",
  NOT_ADVANCED: "Not advanced",
  WINNER: "Winner",
  WITHDRAWN: "Withdrawn",
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Paragraph",
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
  YES_NO: "Yes / No",
};

export const IDEA_STAGES = ["CONCEPT_ONLY", "RESEARCH_COMPLETED", "PROTOTYPE_DEVELOPED", "TESTING_PILOT", "ALREADY_OPERATING"] as const;

/** The stage applications are scored and decided at, and which application state is in play. */
export function evaluationStage(state: CompetitionState): { stage: "SHORTLISTING" | "PITCH_VIDEO" | "FINAL"; applicationState: ApplicationState; label: string } | null {
  switch (state) {
    case "SHORTLISTING": return { stage: "SHORTLISTING", applicationState: "SUBMITTED", label: "Shortlisting" };
    case "PITCH_VIDEO": return { stage: "PITCH_VIDEO", applicationState: "SHORTLISTED", label: "Pitch video review" };
    case "FINALS": return { stage: "FINAL", applicationState: "FINALIST", label: "Live final" };
    default: return null;
  }
}

export function ordinal(rank: number) {
  return rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;
}

/** "competition.published" -> "Competition published". */
export function eventLabel(action: string) {
  const text = action.replace(/[._]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
