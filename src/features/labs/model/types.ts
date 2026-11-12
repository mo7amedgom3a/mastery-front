import type { BrandColor } from "@/components/ui/brand-colors";

export type DealSlug = "deal-recovery-real-estate" | "deal-recovery-medical" | "deal-recovery-food" | "deal-recovery-restaurants";

/** Objection labs: the six-type drill and the competitor-satisfied "ruler" case. */
export type ObjectionSlug = "objections-six-types" | "objections-competitor-ruler";

export type LabSlug =
  | "marketing-ads"
  | "sales-discovery-call"
  | "hr-conflict-mediation"
  | "ceo-competitor-response"
  | "support-angry-customer"
  | ObjectionSlug
  | "sales-failure-week"
  | DealSlug;

/** The axes of the learner's skill profile; every scorecard dimension feeds one of them. */
export type Skill = "communication" | "analysis" | "persuasion" | "empathy" | "decision" | "execution" | "strategy";

export const skillLabels: Record<Skill, string> = {
  communication: "التواصل",
  analysis: "التحليل والاكتشاف",
  persuasion: "الإقناع والتفاوض",
  empathy: "الذكاء العاطفي",
  decision: "اتخاذ القرار",
  execution: "دقة التنفيذ",
  strategy: "التفكير الاستراتيجي",
};

/** One-word skill names for tight charts (the radar); tooltips keep `skillLabels`. */
export const skillShortLabels: Record<Skill, string> = {
  communication: "التواصل",
  analysis: "التحليل",
  persuasion: "الإقناع",
  empathy: "التعاطف",
  decision: "القرار",
  execution: "التنفيذ",
  strategy: "الاستراتيجية",
};

export type Difficulty = "مبتدئ" | "متوسط" | "متقدّم";

export type LabDefinition = {
  slug: LabSlug;
  /** `b2c.categories.legacy_category_id` of the catalog category the lab belongs to. */
  categoryLegacyId: number;
  categoryName: string;
  title: string;
  tagline: string;
  /** Who the learner plays. */
  role: string;
  scenario: string;
  targets: readonly string[];
  constraints: readonly string[];
  skills: readonly Skill[];
  difficulty: Difficulty;
  minutes: number;
  color: BrandColor;
  /** The lab-specific phases between the briefing and the debrief. */
  phases: readonly string[];
  /** Title keywords (most relevant first) that rank the category's courses and diplomas to recommend. */
  courseKeywords: readonly string[];
  /** Catalog card slugs to pin first in recommendations (e.g. the course this lab is built on). */
  featuredCourseSlugs?: readonly string[];
};

export type ComingSoonLab = {
  categoryLegacyId: number;
  categoryName: string;
  title: string;
  tagline: string;
  color: BrandColor;
};

export type Readiness = "مبتدئ" | "جاهز" | "متميّز";

export type Dimension = {
  key: string;
  label: string;
  /** 0–100. */
  score: number;
  weight: number;
  skill: Skill;
  /** What the learner did well, shown when the score is high. */
  praise: string;
  /** What to do next time, shown when the score is low. */
  tip: string;
};

export type HighlightTone = "good" | "bad" | "info";

export type Highlight = {
  /** "02:45" in a conversation, "اليوم 4" in the ad lab. */
  at: string;
  tone: HighlightTone;
  text: string;
};

export type BadgeId =
  | "first-lab"
  | "budget-sniper"
  | "deal-closer"
  | "peacemaker"
  | "share-defender"
  | "cool-head"
  | "deal-saver"
  | "fair-terms"
  | "objection-reader"
  | "ruler-master"
  | "rejection-proof"
  | "funnel-master"
  | "excellence"
  | "all-rounder";

export type Scorecard = {
  overall: number;
  readiness: Readiness;
  dimensions: Dimension[];
  highlights: Highlight[];
  strengths: string[];
  tips: string[];
  /** One headline line under the score (e.g. "حققت الهدف بـ 94$"). */
  verdict: string;
};

/** Facts the lab hands to the badge rules. */
export type BadgeSignals = {
  marketingTargetMet?: boolean;
  dealClosed?: boolean;
  peaceMade?: boolean;
  shareDefended?: boolean;
  coolHead?: boolean;
  dealSaved?: boolean;
  fairTerms?: boolean;
  objectionReader?: boolean;
  rulerMaster?: boolean;
  rejectionProof?: boolean;
  funnelMaster?: boolean;
};

export type QuizOption = {
  label: string;
  /** 0 (poor) – 2 (best practice). */
  points: number;
  /** Behaviour style this answer reveals (pre-lab profile). */
  style?: BehaviourStyle;
};

export type QuizQuestion = {
  prompt: string;
  options: readonly QuizOption[];
  /** Shown after answering. */
  explain: string;
};

export type BehaviourStyle = "assertive" | "collaborative" | "analytical" | "avoidant";

export const behaviourStyleLabels: Record<BehaviourStyle, { label: string; text: string }> = {
  assertive: { label: "حازم", text: "تميل إلى الحسم والمبادرة، انتبه ألا يسبق الحسمُ الاستماعَ." },
  collaborative: { label: "تعاوني", text: "تبحث عن أرضية مشتركة وتبني الثقة، وهذه نقطة قوة في المواقف الحساسة." },
  analytical: { label: "تحليلي", text: "تبني قراراتك على البيانات، احرص على ألا يبطئك التحليل عن التصرّف." },
  avoidant: { label: "متجنّب", text: "تميل إلى تأجيل المواجهة، والمختبر مكان آمن لتجربة الحسم." },
};

export type QuizResult = { percent: number; style: BehaviourStyle | null };

export type LabResult = {
  scorecard: Scorecard;
  xp: number;
  newBadges: BadgeId[];
  pre: QuizResult | null;
  post: QuizResult | null;
};
