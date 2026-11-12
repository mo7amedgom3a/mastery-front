/**
 * Objection labs: the six-type drill and the competitor-satisfied "ruler" case. Both share the
 * dossier, commitment, CRM and quiz shapes; the mechanic differs (classify each objection vs walk
 * the five ruler steps).
 */
import type { Persona } from "../../model/dialogue";
import type { Highlight, ObjectionSlug, QuizQuestion } from "../../model/types";

/** A lesson shown next to an option; the scorecard supplies the timeline anchor when it records it. */
export type Note = Pick<Highlight, "tone" | "text">;

export type ObjectionKind = "misunderstanding" | "doubt" | "real-defect" | "no-need" | "competitor" | "false";

export const objectionKinds: Record<ObjectionKind, { label: string; short: string; text: string }> = {
  misunderstanding: {
    label: "سوء فهم",
    short: "سوء فهم",
    text: "العميل فهم المعلومة غلط: السعر، المواصفات، أو طريقة العمل.",
  },
  doubt: {
    label: "شك",
    short: "شك",
    text: "فهم كلامك لكنه لا يثق فيه ويطلب دليلًا مطبوعًا أو رسميًا.",
  },
  "real-defect": {
    label: "عيب حقيقي",
    short: "عيب حقيقي",
    text: "يرى عيبًا حقيقيًا من وجهة نظره: السعر، الجودة، اللون، أو الوقت.",
  },
  "no-need": {
    label: "لا احتياج",
    short: "لا احتياج",
    text: "لا يرى أنه يحتاج المنتج أصلًا، فلا يرى سببًا للاستماع.",
  },
  competitor: {
    label: "راضٍ عن المنافس",
    short: "المنافس",
    text: "مرتاح لمنافسك ولا يريد أن يتعب نفسه بالتغيير.",
  },
  false: {
    label: "اعتراض زائف",
    short: "زائف",
    text: "يخفي الاعتراض الحقيقي باعتراض آخر: «أرسل لي»، «خلني أفكر».",
  },
};

export type BridgeOption = {
  id: string;
  label: string;
  correct: boolean;
  why: string;
};

export type ReplyOption = {
  id: string;
  label: string;
  /** 0 (poor) – 2 (best). */
  quality: 0 | 1 | 2;
  trust: number;
  tension: number;
  tags: readonly string[];
  reaction: string;
  note?: Note;
};

export type ObjectionRound = {
  id: string;
  kind: ObjectionKind;
  /** What the customer says. */
  opening: string;
  /** The body-language tell shown beside the line. */
  signal: string;
  /** What the customer reveals after the right bridge. */
  reveal: string;
  bridges: readonly BridgeOption[];
  replies: readonly ReplyOption[];
};

export type RulerStep = {
  id: string;
  title: string;
  prompt: string;
  customerLine: string;
  options: readonly BridgeOption[];
};

export type BenefitOption = {
  id: string;
  label: string;
  correct: boolean;
  why: string;
};

export type CommitmentOption = {
  id: string;
  label: string;
  /** 0 (poor) – 2 (best). */
  quality: 0 | 1 | 2;
  /** The CRM stage and next step this commitment implies. */
  stage: string;
  nextStep: string;
  note?: Note;
};

export type CrmConfig = {
  stages: readonly { id: string; label: string }[];
  nextSteps: readonly { id: string; label: string }[];
  notes: readonly { id: string; label: string; correct: boolean }[];
};

export type Dossier = {
  company: string;
  industry: string;
  size: string;
  current: string;
  budget: string;
  timeline: string;
  notes: readonly string[];
  signals: readonly string[];
};

type ScenarioBase = {
  slug: ObjectionSlug;
  seller: string;
  contact: Persona;
  dossier: Dossier;
  commitment: {
    prompt: string;
    options: readonly CommitmentOption[];
  };
  crm: CrmConfig;
  preQuiz: readonly QuizQuestion[];
  postQuiz: readonly QuizQuestion[];
};

export type ClassifyScenario = ScenarioBase & {
  mechanic: "classify";
  rounds: readonly ObjectionRound[];
};

export type RulerScenario = ScenarioBase & {
  mechanic: "ruler";
  steps: readonly RulerStep[];
  benefits: readonly BenefitOption[];
  /** The customer's line after the fifth step, before the learner picks the benefit barrier. */
  closing: string;
};

export type ObjectionScenario = ClassifyScenario | RulerScenario;

export type RoundResult = {
  roundId: string;
  kind: ObjectionKind | null;
  bridgeId: string | null;
  replyId: string | null;
  trust: number;
  tension: number;
  tags: readonly string[];
};

export type ObjectionCrmEntry = {
  stage: string | null;
  nextStep: string | null;
  notes: string[];
};

export type ObjectionRun = {
  /** One entry per classify round. */
  rounds: readonly RoundResult[];
  /** One entry per ruler step. */
  rulerSteps: Readonly<Record<string, string>>;
  benefits: readonly string[];
  commitment: string | null;
  crm: ObjectionCrmEntry;
  trust: number;
  tension: number;
};

export function isClassify(scenario: ObjectionScenario): scenario is ClassifyScenario {
  return scenario.mechanic === "classify";
}

export function isRuler(scenario: ObjectionScenario): scenario is RulerScenario {
  return scenario.mechanic === "ruler";
}
