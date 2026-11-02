export type AdvisorMode = "fast" | "reasoning";
export type NeedsAnalysis = {
  status: "discovering" | "complete" | "provisional";
  customer_type: "individual" | "company" | null;
  question_count: number;
  needs_summary: string;
  pain_points: string[];
  reported_gaps: string[];
  skills_to_assess: string[];
  possible_non_training_causes: string[];
  recommended_actions: string[];
  product_matches: { product_id: string; rationale: string; sequence: number }[];
  success_measures: string[];
  uncertainties: string[];
};

/** The backend's advisor contract (`app/modules/advisor/presentation/schemas.py`). */

export type AdvisorIntent =
  | "course_search"
  | "product_details"
  | "comparison"
  | "study_plan"
  | "career_advice"
  | "faq"
  | "smalltalk"
  | "off_topic"
  | "clarification";

export type AdvisorProduct = {
  product_id: string;
  slug: string;
  title: string;
  product_type: string;
  price_amount: string | null;
  currency_code: string | null;
  rating: number | null;
  duration_minutes: number | null;
  image_url: string | null;
  skills: string[];
};

/** A question the advisor needs answered before it recommends; `options` are quick replies. */
export type AdvisorClarification = {
  question: string;
  options: string[];
  slots: string[];
  allow_free_text: boolean;
};

export type AdvisorAnswer = {
  mode?: AdvisorMode;
  needs_analysis?: NeedsAnalysis | null;
  conversation_id: string;
  message_id: string | null;
  answer: string;
  intent: AdvisorIntent;
  source: string;
  cached: boolean;
  products: AdvisorProduct[];
  follow_up_questions: string[];
  clarification_needed: boolean;
  clarification?: AdvisorClarification | null;
};

export type AdvisorSuggestion = {
  question: string;
  label: string;
  intent: AdvisorIntent;
  cached: boolean;
};

/** The visitor-safe part of a `step` event (`public_step` in the backend's `services.py`). */
export type StepPublic = {
  /** `route`: the flow the agent chose for this turn. */
  mode?: "fast" | "reasoning";
  intent?: string;
  topic?: string;
  topics?: string[];
  corrected?: string;
  corrections?: Record<string, string>;
  unknown_terms?: string[];
  goal?: string;
  slot?: string;
  count?: number;
  titles?: string[];
  filled?: Record<string, string>;
  missing?: string[];
  slots?: string[];
  hit?: boolean;
  question_count?: number;
  level?: string;
  budget?: string;
};

/** Server-sent events of `POST /advisor/stream`; `step`, `thought` and the tool events feed the step timeline. */
export type AdvisorEvent =
  | { type: "run_started"; conversation_id: string; mode?: AdvisorMode }
  | { type: "step"; stage: string; status?: string; public?: StepPublic }
  | { type: "tool_call"; id?: string; name: string; arguments?: Record<string, unknown>; step?: number }
  | { type: "tool_result"; id?: string; name: string; result?: Record<string, unknown>; step?: number }
  | { type: "thought"; text: string; step?: number }
  | ({ type: "ask_user" } & AdvisorClarification)
  | { type: "token"; text: string }
  | { type: "final"; answer: AdvisorAnswer }
  | { type: "error"; message: string };

/** One entry of the agent's visible work: understanding, a tool call, a thought or a question. */
export type TraceStep = {
  id: string;
  kind: "step" | "tool" | "thought" | "ask";
  /** Pipeline stage (`understand`, `retrieval`, …) or tool name. */
  name: string;
  status: "running" | "done" | "unknown";
  detail?: StepPublic;
  text?: string;
  /** Tool arguments' query and result count, for tools. */
  query?: string;
  count?: number;
};

/** What the face of the advisor shows (see `advisor-agent.tsx`). */
export type AgentMood = "idle" | "thinking" | "speaking" | "joy" | "sleep";

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      status: "streaming" | "done" | "error";
      /** The question this answers, so a failed one can be asked again. */
      question: string;
      products?: AdvisorProduct[];
      mode?: AdvisorMode;
      needsAnalysis?: NeedsAnalysis;
      followUps?: string[];
      /** The advisor asked a question: the chips are answers to it, not new questions. */
      clarification?: boolean;
      /** Nothing in the catalog matched (or no answer came back): the panel shows what the platform offers instead. */
      showCatalog?: boolean;
      /** Why it failed; `rate_limited` reads differently from a broken connection. */
      error?: "rate_limited" | "failed";
      /** What the agent did to answer, shown as a collapsible timeline. */
      trace?: TraceStep[];
      /** Why the answer has no products: the advisor didn't understand, or the catalog has nothing on it. */
      source?: string;
    };
