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

export type AdvisorAnswer = {
  conversation_id: string;
  message_id: string | null;
  answer: string;
  intent: AdvisorIntent;
  source: string;
  cached: boolean;
  products: AdvisorProduct[];
  follow_up_questions: string[];
  clarification_needed: boolean;
};

export type AdvisorSuggestion = {
  question: string;
  label: string;
  intent: AdvisorIntent;
  cached: boolean;
};

/** Server-sent events of `POST /advisor/stream`; `step`, `tool_call` and `tool_result` are pipeline detail. */
export type AdvisorEvent =
  | { type: "run_started"; conversation_id: string }
  | { type: "step"; stage: string; status?: string }
  | { type: "tool_call" | "tool_result"; name: string }
  | { type: "token"; text: string }
  | { type: "final"; answer: AdvisorAnswer }
  | { type: "error"; message: string };

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
      followUps?: string[];
      /** Nothing in the catalog matched (or no answer came back): the panel shows what the platform offers instead. */
      showCatalog?: boolean;
      /** Why it failed; `rate_limited` reads differently from a broken connection. */
      error?: "rate_limited" | "failed";
    };
