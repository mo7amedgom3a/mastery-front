/**
 * Deal-recovery labs: one flow, four sectors. A `DealScenario` is all the content a sector needs;
 * `buildRecoveryGraph` turns sector lines into the shared recovery-call topology, so every sector
 * gets the same, validated structure (refusal → story → impact → objection → conflict → close).
 */
import type { Activity, PipelineDeal } from "../../components/crm/crm-types";
import type { DocSpec } from "../../components/documents/doc-types";
import type { DialogueGraph, DialogueOutcome, DialogueState, Persona } from "../../model/dialogue";
import type { DealSlug, QuizQuestion } from "../../model/types";

export type RootCause = { id: string; label: string; correct: boolean; why: string };

export type DealStageId = "negotiation" | "awaiting-signature" | "stalled" | "lost";

export const dealStages: readonly { id: DealStageId; label: string }[] = [
  { id: "negotiation", label: "تفاوض (عاد للطاولة)" },
  { id: "awaiting-signature", label: "بانتظار التوقيع" },
  { id: "stalled", label: "متعثرة" },
  { id: "lost", label: "مفقودة" },
];

export const probabilities = [10, 30, 50, 70, 90] as const;
export type Probability = (typeof probabilities)[number];

export type NextStepOption = { id: string; label: string; validFor: readonly DialogueOutcome[] };

export type DealCrmEntry = {
  stage: DealStageId | null;
  value: number | null;
  probability: Probability | null;
  nextStep: string | null;
};

export type DealScenario = {
  slug: DealSlug;
  sector: string;
  /** Our company. */
  seller: string;
  contact: string;
  deal: PipelineDeal;
  /** Probability the CRM showed before it stalled. */
  probability: number;
  pipeline: readonly PipelineDeal[];
  timeline: readonly Activity[];
  rootCauses: readonly RootCause[];
  graph: DialogueGraph;
  facts: Record<string, string>;
  /** The contract / proposal the learner redlines. */
  document: DocSpec;
  fileName: string;
  /** Starting acceptance and margin before any redline, and the annual value in SAR. */
  base: { acceptance: number; margin: number; value: number };
  nextSteps: readonly NextStepOption[];
  preQuiz: readonly QuizQuestion[];
  postQuiz: readonly QuizQuestion[];
};

// ---------- recovery-call factory ----------

type Line = string;
type Choice = string;

/** Sector copy for every slot of the shared recovery-call topology. */
export type RecoveryCopy = {
  id: string;
  title: string;
  persona: Persona;
  /** Fact ids revealed at: story, impact, conflict. */
  facts: { story: string; impact: string; stake: string };
  lines: {
    open: Line;
    story: Line;
    angry: Line;
    cheap: Line;
    impact: Line;
    objection: Line;
    conflict: Line;
    proposal: Line;
    cold: Line;
    success: Line;
    neutral: Line;
    coldNeutral: Line;
    walkout: Line;
    hangup: Line;
    pushed: Line;
  };
  choices: {
    /** open → story */
    acknowledge: Choice;
    /** open → angry */
    defend: Choice;
    /** open → cheap */
    discountFirst: Choice;
    /** story → impact */
    digDeeper: Choice;
    /** story → objection */
    jumpToFix: Choice;
    /** angry → story */
    deescalate: Choice;
    /** angry → hangup */
    blame: Choice;
    /** cheap → story */
    recoverToListen: Choice;
    /** cheap → objection */
    moreDiscount: Choice;
    /** impact → objection */
    summarise: Choice;
    /** impact → objection (overpromise) */
    promiseAll: Choice;
    /** objection → conflict, requires the impact fact */
    handleWithEvidence: Choice;
    /** objection → conflict */
    handleGeneric: Choice;
    /** objection → conflict (bash) */
    bashCompetitor: Choice;
    /** conflict → gate */
    ownIt: Choice;
    /** conflict → gate (defensive) */
    deflect: Choice;
    /** proposal → success */
    proposeNextStep: Choice;
    /** proposal → neutral */
    sendBrochure: Choice;
    /** cold → neutral */
    askSmallStep: Choice;
    /** cold → fail */
    pushHard: Choice;
  };
};

const trusted = (s: DialogueState) => s.meters.trust >= 55;

export function buildRecoveryGraph(copy: RecoveryCopy): DialogueGraph {
  const { lines: l, choices: c, facts: f } = copy;
  const p = "client";
  return {
    id: copy.id,
    title: copy.title,
    start: "open",
    personas: { [p]: copy.persona },
    initial: { trust: 30, patience: 70, tension: 55 },
    visibleMeters: ["trust", "tension"],
    turnCost: { patience: -4 },
    breakpoints: [
      { when: (s) => s.meters.tension >= 90, to: "walkout" },
      { when: (s) => s.meters.patience <= 0, to: "walkout" },
    ],
    nodes: {
      open: {
        id: "open",
        speaker: p,
        line: l.open,
        choices: [
          {
            id: "acknowledge",
            label: c.acknowledge,
            tags: ["empathy", "open-question"],
            effects: { trust: 12, tension: -10 },
            next: "story",
            note: { tone: "good", text: "بدأ بالاعتراف بالمشكلة وسؤال مفتوح بدل الدفاع أو العرض." },
          },
          {
            id: "defend",
            label: c.defend,
            tags: ["defensive"],
            effects: { trust: -10, tension: 15 },
            next: "angry",
            note: { tone: "bad", text: "دافع عن الشركة قبل أن يسمع العميل." },
          },
          {
            id: "discount-first",
            label: c.discountFirst,
            tags: ["discount"],
            effects: { trust: -5 },
            next: "cheap",
            note: { tone: "bad", text: "عرض خصمًا قبل أن يفهم سبب التعثر." },
          },
        ],
      },
      story: {
        id: "story",
        speaker: p,
        line: l.story,
        reveals: [f.story],
        choices: [
          {
            id: "dig-deeper",
            label: c.digDeeper,
            tags: ["open-question", "listen"],
            effects: { trust: 8 },
            next: "impact",
            note: { tone: "good", text: "تعمّق في أثر المشكلة على العميل قبل اقتراح أي حل." },
          },
          {
            id: "jump-to-fix",
            label: c.jumpToFix,
            tags: ["pitch"],
            effects: { trust: -3 },
            next: "objection",
            note: { tone: "info", text: "قفز إلى الحل قبل فهم الأثر الكامل." },
          },
        ],
      },
      angry: {
        id: "angry",
        speaker: p,
        line: l.angry,
        choices: [
          {
            id: "deescalate",
            label: c.deescalate,
            tags: ["empathy", "ownership"],
            effects: { tension: -15, trust: 6 },
            next: "story",
            note: { tone: "good", text: "تدارك الموقف: اعترف بالخطأ وخفّض التوتر." },
          },
          {
            id: "blame",
            label: c.blame,
            tags: ["blame"],
            effects: { tension: 15, trust: -20 },
            next: "hangup",
            note: { tone: "bad", text: "ألقى اللوم على طرف آخر أمام عميل غاضب." },
          },
        ],
      },
      cheap: {
        id: "cheap",
        speaker: p,
        line: l.cheap,
        choices: [
          {
            id: "recover-to-listen",
            label: c.recoverToListen,
            tags: ["open-question", "recovery"],
            effects: { trust: 6, tension: -5 },
            next: "story",
            note: { tone: "good", text: "تراجع عن الخصم وعاد للاستماع." },
          },
          {
            id: "more-discount",
            label: c.moreDiscount,
            tags: ["discount"],
            effects: { trust: -10, tension: 5 },
            next: "objection",
            note: { tone: "bad", text: "زاد الخصم بينما المشكلة ليست السعر." },
          },
        ],
      },
      impact: {
        id: "impact",
        speaker: p,
        line: l.impact,
        reveals: [f.impact],
        choices: [
          {
            id: "summarise",
            label: c.summarise,
            tags: ["listen", "empathy"],
            effects: { trust: 8, tension: -5 },
            next: "objection",
            note: { tone: "good", text: "لخّص المشكلة بكلمات العميل فشعر أنه مسموع." },
          },
          {
            id: "promise-all",
            label: c.promiseAll,
            tags: ["overpromise"],
            effects: { trust: -10 },
            next: "objection",
            note: { tone: "bad", text: "وعد بحل كل شيء دون أساس، والعميل سمع هذا من قبل." },
          },
        ],
      },
      objection: {
        id: "objection",
        speaker: p,
        line: l.objection,
        choices: [
          {
            id: "handle-evidence",
            label: c.handleWithEvidence,
            requires: [f.impact],
            tags: ["objection-handle", "proof"],
            effects: { trust: 12, tension: -5 },
            next: "conflict",
            note: { tone: "good", text: "رد على الاعتراض بربط الحل بما اكتشفه من العميل نفسه." },
          },
          {
            id: "handle-generic",
            label: c.handleGeneric,
            tags: ["objection-handle"],
            effects: { trust: 3 },
            next: "conflict",
          },
          {
            id: "bash",
            label: c.bashCompetitor,
            tags: ["competitor-bash"],
            effects: { trust: -12, tension: 10 },
            next: "conflict",
            note: { tone: "bad", text: "هاجم البديل الذي يفكر فيه العميل، فبدا دفاعيًا." },
          },
        ],
      },
      conflict: {
        id: "conflict",
        speaker: p,
        line: l.conflict,
        reveals: [f.stake],
        effects: { tension: 10 },
        choices: [
          {
            id: "own-it",
            label: c.ownIt,
            tags: ["ownership", "empathy"],
            effects: { trust: 10, tension: -20 },
            next: "gate",
            note: { tone: "good", text: "تحمّل المسؤولية واقترح علاجًا محددًا بدل التبرير." },
          },
          {
            id: "deflect",
            label: c.deflect,
            tags: ["defensive"],
            effects: { trust: -10, tension: 25 },
            next: "gate",
            note: { tone: "bad", text: "تهرّب من المسؤولية في أكثر لحظة حساسة." },
          },
        ],
      },
      gate: {
        id: "gate",
        speaker: p,
        line: "…",
        redirect: [
          { when: trusted, to: "proposal" },
          { when: () => true, to: "cold" },
        ],
      },
      proposal: {
        id: "proposal",
        speaker: p,
        line: l.proposal,
        choices: [
          {
            id: "propose",
            label: c.proposeNextStep,
            tags: ["close"],
            effects: { trust: 5 },
            next: "success",
            note: { tone: "good", text: "أغلق بخطوة محددة: شروط معدلة وموعد مع صاحب القرار." },
          },
          {
            id: "brochure",
            label: c.sendBrochure,
            tags: ["passive"],
            next: "neutral",
            note: { tone: "info", text: "ترك الخطوة التالية مفتوحة بإرسال مستندات فقط." },
          },
        ],
      },
      cold: {
        id: "cold",
        speaker: p,
        line: l.cold,
        choices: [
          { id: "small-step", label: c.askSmallStep, tags: ["close"], next: "cold-neutral" },
          {
            id: "push-hard",
            label: c.pushHard,
            tags: ["pushy"],
            effects: { trust: -15 },
            next: "pushed",
            note: { tone: "bad", text: "ضغط لإغلاق صفقة فقد العميل ثقته فيها." },
          },
        ],
      },
      success: { id: "success", speaker: p, line: l.success, end: "success" },
      neutral: { id: "neutral", speaker: p, line: l.neutral, end: "neutral" },
      "cold-neutral": { id: "cold-neutral", speaker: p, line: l.coldNeutral, end: "neutral" },
      walkout: { id: "walkout", speaker: p, line: l.walkout, end: "fail" },
      hangup: { id: "hangup", speaker: p, line: l.hangup, end: "fail" },
      pushed: { id: "pushed", speaker: p, line: l.pushed, end: "fail" },
    },
  };
}

/** Pipeline filler shared by every sector board (other reps' deals). */
export function fillerDeals(prefix: string, rows: readonly [string, string, number, string, number, PipelineDeal["health"], string][]): PipelineDeal[] {
  return rows.map(([company, title, value, owner, ageDays, health, stage], index) => ({
    id: `${prefix}-${index}`,
    company,
    title,
    value,
    owner,
    ageDays,
    health,
    stage,
  }));
}
