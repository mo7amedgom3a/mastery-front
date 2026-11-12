/** Sales-failure lab: a week of selling, the funnel maths, the question bank, the GPS call and follow-up. */
import type { DialogueGraph, DialogueOutcome, Persona } from "../../model/dialogue";
import type { Highlight, QuizQuestion } from "../../model/types";

export type WeekDay = "sun" | "mon" | "tue" | "wed" | "thu";
export type ActivityId = "prospecting" | "calls" | "visits" | "followup" | "proposals" | "learning";

export type Activity = {
  id: ActivityId;
  label: string;
  hint: string;
  /** One of the five activities a balanced week must cover. */
  core: boolean;
};

export type WeekPlan = Readonly<Record<WeekDay, readonly ActivityId[]>>;

export type FunnelTargets = {
  deals: number;
  /** Conversion rates, 0–1. */
  prospectToCall: number;
  callToMeeting: number;
  meetingToProposal: number;
  proposalToClose: number;
};

export type FunnelAnswer = { prospects: number; calls: number; meetings: number; proposals: number };

export type QuestionOption = {
  id: string;
  label: string;
  correct: boolean;
  why: string;
};

export type FollowUpSlot = 1 | 2 | 3;

export type FollowUpOption = {
  id: string;
  slot: FollowUpSlot;
  label: string;
  timing: string;
  channel: string;
  correct: boolean;
  why: string;
};

export type CauseId =
  | "rejection"
  | "objections"
  | "mindset"
  | "plan"
  | "questions"
  | "numbers"
  | "emotions"
  | "depth"
  | "followup"
  | "learning";

export type Cause = { id: CauseId; label: string; text: string };

export type CauseStatus = "avoided" | "missed" | "untested";

export type SalesFailureScenario = {
  seller: string;
  contact: Persona;
  factory: {
    name: string;
    industry: string;
    size: string;
    line: string;
    objection: string;
  };
  week: readonly { id: WeekDay; label: string }[];
  activities: readonly Activity[];
  funnel: FunnelTargets;
  questionBank: readonly QuestionOption[];
  graph: DialogueGraph;
  facts: Record<string, string>;
  followUp: readonly FollowUpOption[];
  causes: readonly Cause[];
  preQuiz: readonly QuizQuestion[];
  postQuiz: readonly QuizQuestion[];
};

export type SalesFailureRun = {
  plan: WeekPlan;
  funnel: FunnelAnswer;
  questions: readonly string[];
  call: { outcome: DialogueOutcome | null; tags: readonly string[]; notes: readonly Highlight[] };
  followUp: Readonly<Record<FollowUpSlot, string | null>>;
  postPercent: number;
};
