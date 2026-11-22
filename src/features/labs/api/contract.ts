/**
 * The labs API contract.
 *
 * These types mirror the planned FastAPI surface (`/api/v1/labs/*`, `/api/v1/me/labs/*`,
 * `/api/v1/admin/labs/*`). The mock server implements them today; when the backend module ships,
 * the hand-written shapes are replaced by aliases of the generated `SuccessResponse<Operation>`
 * types, keeping the same field names.
 *
 * Rules:
 * - snake_case, ISO-8601 timestamps, UUIDs as strings.
 * - Public runtime payloads never include hidden facts, private rubric rules or admin notes.
 * - UI-only concepts (phase components, local run state) stay out of the contract.
 */
import type { BrandColor } from "@/components/ui/brand-colors";
import type { CatalogCard } from "@/lib/api/browse";

import type {
  BadgeId,
  BadgeSignals,
  Difficulty,
  Dimension,
  Highlight,
  QuizQuestion,
  QuizResult,
  Readiness,
  Scorecard,
  Skill,
} from "../model/types";
import type { ResolvedEngineDoc } from "../model/dialogue-runtime";

export type LabEngine = "legacy" | "schema" | "blocks" | "dialogue";
export type LabStatus = "draft" | "in_review" | "scheduled" | "published" | "paused" | "archived";
export type LabSessionStatus = "created" | "in_progress" | "completed" | "abandoned" | "expired" | "failed";
export type LabAttemptStatus = "scored" | "flagged" | "overridden" | "voided";

export type LocalizedText = { ar: string; en?: string };

export type LabFieldType =
  | "text"
  | "textarea"
  | "number"
  | "range"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "table"
  | "allocation"
  | "document"
  | "chat";

export type LabFieldOption = { value: string; label: LocalizedText };

export type LabConditionOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "exists";

/** A small, safe condition shape. Expressions are strings such as `meter.trust >= 60`. */
export type LabCondition =
  | { left: string; op: LabConditionOperator; right?: unknown }
  | string;

export type LabFieldValidation = {
  min?: number;
  max?: number;
  step?: number;
  max_length?: number;
  pattern?: string;
  options?: LabFieldOption[];
};

export type LabField = {
  id: string;
  type: LabFieldType;
  label: LocalizedText;
  help?: LocalizedText;
  default?: unknown;
  required?: boolean;
  validation?: LabFieldValidation;
  visible_when?: LabCondition[];
  score?: { dimension: string; weight?: number; rule?: string; rubric?: Record<string, number> };
  analytics?: { event?: string; bucket?: boolean };
};

export type LabPersona = {
  id: string;
  name: string;
  role: string;
  tone?: BrandColor;
  traits: string[];
  /** Admin-only. Stripped from the public runtime. */
  hidden_facts?: string[];
  /** Admin-only. Stripped from the public runtime. */
  triggers?: { when: LabCondition[]; response: string }[];
};

export type LabPathwayNodeType =
  | "brief"
  | "choice"
  | "dialogue"
  | "form"
  | "simulator"
  | "document"
  | "crm"
  | "quiz"
  | "branch"
  | "end";

export type LabPathwayChoice = {
  id: string;
  label: LocalizedText;
  next: string;
  effects?: Record<string, unknown>;
  conditions?: LabCondition[];
  score?: Record<string, number>;
  note?: { tone: "good" | "bad" | "info"; text: string };
};

export type LabPathwayNode = {
  id: string;
  type: LabPathwayNodeType;
  title?: LocalizedText;
  prompt?: LocalizedText;
  persona_id?: string;
  fields?: string[];
  choices?: LabPathwayChoice[];
  conditions?: { when: LabCondition[]; to: string }[];
  next?: string;
  content?: Record<string, unknown>;
  outcome?: "success" | "neutral" | "fail";
};

/**
 * Multi-Choice Pathways (MCP).
 *
 * Named `pathway` in code and storage to avoid confusion with the Model Context Protocol. The
 * admin builds the graph; the runtime walks it. Every edge must point to a node, every path must
 * end, and every cycle must be bounded by `limits`.
 */
export type LabPathway = {
  entry: string;
  nodes: Record<string, LabPathwayNode>;
  limits?: { max_steps?: number; max_minutes?: number };
};

export type LabRequirementType = "auth" | "entitlement" | "assignment" | "date_window" | "skill" | "consent";

export type LabRequirement = {
  id: string;
  type: LabRequirementType;
  label: LocalizedText;
  /** Entitlement product types, product slugs, skill ids, assignment scope, etc. */
  values?: string[];
  on_fail?: "block" | "warn";
  message?: LocalizedText;
};

export type LabRequirementStatus = {
  id: string;
  type: LabRequirementType;
  satisfied: boolean;
  reason?: string;
};

export type LabScoring = {
  dimensions: {
    key: string;
    label: LocalizedText;
    skill: Skill;
    weight: number;
    /** Optional rule for schema labs; legacy labs use a registered scorer instead. */
    rule?: string;
  }[];
  signals?: { key: string; label: LocalizedText; when: LabCondition[] }[];
  readiness?: { ready: number; excellent: number };
  xp?: { base: number; per_point: number; per_badge: number };
};

export type LabAnalyticsSpec = {
  events?: string[];
  observations?: { when: LabCondition[]; tone: "good" | "bad" | "info"; text: string }[];
  metrics?: { key: string; label: LocalizedText; rule?: string }[];
};

export type LabRelease = {
  status: LabStatus;
  locales: string[];
  starts_at: string | null;
  ends_at: string | null;
  /** 0–100; new sessions only. In-flight sessions keep their version. */
  rollout_pct: number;
  kill_switch?: boolean;
};

export type LabRecommendationsConfig = {
  course_slugs?: string[];
  diploma_slugs?: string[];
  keywords?: string[];
  product_types?: string[];
};

/** The editable definition (admin draft / immutable version). */
export type LabDefinitionPayload = {
  schema_version: 1;
  slug: string;
  field_category_id: number;
  category_name: string;
  engine: LabEngine;
  title: string;
  tagline: string;
  role: string;
  scenario: string;
  targets: string[];
  constraints: string[];
  skills: Skill[];
  difficulty: Difficulty;
  minutes: number;
  color: BrandColor;
  phases: { id: string; label: string; type: string }[];
  personas: LabPersona[];
  fields: LabField[];
  pathway: LabPathway | null;
  requirements: LabRequirement[];
  scoring: LabScoring;
  analytics: LabAnalyticsSpec;
  recommendations: LabRecommendationsConfig;
  /** The bespoke runner this lab still uses (legacy engine only). */
  legacy_slug?: string;
  locale: string;
  release: LabRelease;
};

export type LabSummary = {
  lab_id: string;
  slug: string;
  title: string;
  tagline: string;
  field_category_id: number;
  category_name: string;
  engine: LabEngine;
  skills: Skill[];
  difficulty: Difficulty;
  minutes: number;
  color: BrandColor;
  status: LabStatus;
  version: number | null;
  product_slugs: string[];
  attempt_count?: number;
  best_score?: number | null;
};

export type LabList = { items: LabSummary[]; total: number };
export type LabAttemptList = { items: LabAttempt[]; total: number };

export type LabPhaseView = { id: string; label: string; type: string };

/** The public runtime definition. */
export type LabRuntime = {
  lab_id: string;
  slug: string;
  version: number;
  engine: LabEngine;
  title: string;
  tagline: string;
  role: string;
  scenario: string;
  targets: string[];
  constraints: string[];
  field_category_id: number;
  category_name: string;
  skills: Skill[];
  difficulty: Difficulty;
  minutes: number;
  color: BrandColor;
  phases: LabPhaseView[];
  personas: LabPersona[];
  fields: LabField[];
  pathway: LabPathway | null;
  requirements: LabRequirement[];
  scoring: LabScoring;
  recommendations: LabRecommendationsConfig;
  legacy_slug?: string;
  locale: string;
};

export type LabSessionState = {
  phase_id: string | null;
  seq: number;
  answers: Record<string, unknown>;
  meters?: Record<string, number>;
  facts?: string[];
  flags?: Record<string, unknown>;
  visited_nodes?: string[];
  completed_phases?: string[];
  actions_count: number;
};

export type LabSession = {
  session_id: string;
  lab_id: string;
  lab_slug: string;
  lab_version: number;
  customer_id: string | null;
  anonymous_id: string;
  status: LabSessionStatus;
  state: LabSessionState;
  seed: number;
  requirements: LabRequirementStatus[];
  started_at: string;
  updated_at: string;
  expires_at: string;
  completed_at: string | null;
  /** Preview sessions never write attempts or analytics. */
  preview?: boolean;
  /** Live API: the scenario this session pinned (labs can hold several scenarios). */
  scenario_key?: string;
};

export type LiveBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: LiveBlock[];
  visible_when?: LabCondition[];
  admin_only?: boolean;
  version?: number;
};

export type LiveBlockPage = {
  id: string;
  title?: LocalizedText | null;
  blocks: LiveBlock[];
  next_page?: string | null;
  show_in_trail?: boolean;
};

export type LiveBlockDocument = {
  schema_version?: number;
  title?: LocalizedText | null;
  intro?: string | null;
  pages: LiveBlockPage[];
  fields?: LabField[];
  personas?: LabPersona[];
};

export type LabAction =
  | { type: "phase.enter"; phase_id: string }
  | { type: "page.enter"; page_id: string }
  | { type: "form.submit"; phase_id: string; block_id?: string; values: Record<string, unknown>; next_page?: string }
  | { type: "choice.select"; block_id: string; choice_id: string; next_page?: string }
  | { type: "quiz.submit"; phase: "pre" | "post"; answers: number[] }
  | { type: "dialogue.choose"; graph_id: string; node_id: string; choice_id: string }
  | { type: "form.submit"; phase_id: string; values: Record<string, unknown> }
  | { type: "simulator.step"; phase_id: string; decision: Record<string, unknown> }
  | { type: "document.redline"; phase_id: string; clause_id: string; option_id: string }
  | { type: "crm.update"; phase_id: string; entry: Record<string, unknown> }
  | { type: "commitment.set"; phase_id: string; value: string };

export type LabActionRequest = {
  client_action_id: string;
  /** The next sequence number known to the client. The server rejects stale values. */
  seq: number;
  action: LabAction;
  at?: string;
};

export type LabActionResult = {
  accepted: true;
  session: LabSession;
  effects?: Record<string, unknown>;
};

export type LegacyScorerId =
  | "marketing"
  | "sales"
  | "hr"
  | "support"
  | "ceo"
  | "objections"
  | "ruler"
  | "deals"
  | "sales-failure"
  | "registration"
  | "governance"
  | "forecast"
  | "close"
  | "crisis"
  | "escape";

export type LabCompletionRequest = {
  engine: LabEngine;
  scorer?: LegacyScorerId;
  /** Legacy only: the run state the existing scorer expects. */
  run?: unknown;
  /** Schema only: the submitted field/choice answers. */
  answers?: Record<string, unknown>;
  pre: QuizResult | null;
  post: QuizResult | null;
  elapsed_seconds: number;
  /**
   * Live API: the scorecard computed by the runner. Engines not yet ported to the server store it
   * as an unverified attempt; server-scored engines only compare it (a mismatch flags the attempt).
   */
  client_result?: { scorecard: Scorecard; signals: BadgeSignals };
};

export type LabAttempt = {
  attempt_id: string;
  session_id: string;
  slug: string;
  at: string;
  overall: number;
  readiness: Readiness;
  dimensions: Dimension[];
  xp: number;
  badges: BadgeId[];
  category_legacy_id: number;
  category_name: string;
  minutes: number;
  highlights: Highlight[];
  pre: QuizResult | null;
  post: QuizResult | null;
  signals: BadgeSignals;
  attempt_no: number;
  lab_version: number;
  source: "lab" | "demo" | "imported";
  status: LabAttemptStatus;
  /** Live API: the scenario the attempt ran. */
  scenario_key?: string;
  /** Live API: false when the score came from the client (engine not ported to the server yet). */
  verified?: boolean;
};

export type LabCompletionResult = {
  /** Null for live preview sessions (nothing is stored). */
  attempt: LabAttempt | null;
  scorecard: Scorecard;
  new_badges: BadgeId[];
  /** Live API extras. */
  xp?: number;
  verified?: boolean;
  preview?: boolean;
};

// ---------- live API (backend `app/modules/labs`) ----------

export type LiveScenarioSummary = { key: string; title: string; weight: number; sort_order: number };

/** Runtime projection of one scenario document; `content` is shaped by the lab's engine. */
export type LiveScenario = {
  key: string;
  title: string;
  schema_version: number;
  /** Engine content-catalog version this document was published against. */
  catalog_version?: number;
  content: Record<string, unknown> & { bundled_slug?: string };
};

export type LiveLabCard = {
  slug: string;
  engine_key: string;
  title: string;
  tagline: string;
  field_category_id: number | null;
  category_name: string | null;
  difficulty: Difficulty;
  minutes: number;
  color: BrandColor;
  skills: Skill[];
};

/** `GET /labs/{slug}`: published (or previewed) lab-level definition plus the selected scenario. */
export type LiveLabRuntime = {
  lab_id: string;
  version: number;
  engine: string;
  scorer: "server" | "client";
  card: LiveLabCard;
  definition: {
    role: string;
    scenario: string;
    targets: string[];
    constraints: string[];
    phases: LabPhaseView[];
    requirements: LabRequirement[];
    scoring: LabScoring;
    recommendations: LabRecommendationsConfig;
    scenario_selection: "choose" | "random" | "first";
    locale: string;
    pre_quiz?: QuizQuestion[];
    post_quiz?: QuizQuestion[];
  };
  scenarios: LiveScenarioSummary[];
  scenario: LiveScenario | null;
  preview?: boolean;
  /** The admin engine the lab is built on (public part), or null for labs without one. */
  engine_profile?: ResolvedEngineDoc | null;
};

export type LiveLabSummary = LiveLabCard & {
  lab_id: string;
  version: number | null;
  status: LabStatus;
  scorer: "server" | "client";
  attempt_count: number;
  best_score: number | null;
};

export type LiveLabList = { items: LiveLabSummary[]; total: number };

export type LabRecommendationCard = CatalogCard;

export type LabRecommendationSet = {
  courses: LabRecommendationCard[];
  diplomas: LabRecommendationCard[];
  packages: LabRecommendationCard[];
  bundles: LabRecommendationCard[];
  consultations: LabRecommendationCard[];
  live_diplomas: LabRecommendationCard[];
  subscriptions: LabRecommendationCard[];
};

export type LabInsights = {
  attempts: LabAttempt[];
  total_attempts: number;
  labs_completed: number;
  total_minutes: number;
  total_xp: number;
  badges: BadgeId[];
  average: number | null;
};

export type AdminLab = LabSummary & {
  draft_revision: number;
  published_version: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  release: LabRelease;
  completion_rate: number;
  avg_score: number | null;
};

export type LabDraft = {
  lab: AdminLab;
  definition: LabDefinitionPayload;
  published_definition: LabDefinitionPayload | null;
  has_unpublished_changes: boolean;
};

export type AdminLabList = { items: AdminLab[]; total: number };

export type LabValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type LabVersion = {
  version: number;
  published_at: string;
  published_by: string;
  checksum: string;
  definition: LabDefinitionPayload;
};

export type LabAnalytics = {
  lab_id: string;
  lab_slug: string;
  attempts: number;
  completions: number;
  completion_rate: number;
  avg_score: number | null;
  avg_minutes: number | null;
  funnel: { phase_id: string; label: string; entries: number; completions: number; drop_rate: number }[];
  branches: { node_id: string; label: string; visits: number; choices: { choice_id: string; label: string; count: number }[] }[];
  dimensions: { key: string; label: string; average: number }[];
  signals: { key: string; count: number }[];
};

export type LabGenerationRequest = {
  prompt: string;
  field_category_id?: number;
  category_name?: string;
  product_slug?: string;
  difficulty?: Difficulty;
  minutes?: number;
  locale?: string;
  engine?: LabEngine;
};

export type LabGenerationJob = {
  job_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  prompt: string;
  draft: LabDefinitionPayload | null;
  error: string | null;
  created_at: string;
};

export type LabAssignment = {
  assignment_id: string;
  lab_id: string;
  scope_type: "cohort" | "company" | "user";
  scope_id: string;
  due_at: string | null;
  required: boolean;
  created_at: string;
};

export type LabAsset = {
  asset_id: string;
  lab_id: string;
  url: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  alt_text: string | null;
  created_at: string;
};

export type LabPreviewToken = {
  token: string;
  path: string;
  expires_at: string;
};

export type LabOverview = {
  labs: number;
  published: number;
  drafts: number;
  attempts: number;
  completion_rate: number;
  avg_score: number | null;
};

export type LabApiErrorBody = {
  detail?: unknown;
  code?: string;
  request_id?: string;
};

export type LabApiQuery = Record<string, string | number | boolean | null | undefined>;
