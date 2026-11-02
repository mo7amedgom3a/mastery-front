import type { AdvisorEvent, TraceStep } from "./types";

/** Pipeline stages a visitor finds meaningful; the rest (normalize, persist, cache_store, …) stay hidden. */
const VISIBLE_STAGES = new Set([
  "understand",
  "route",
  "resume",
  "retrieval",
  "exact_cache",
  "semantic_cache",
  "slots",
  "clarification",
  "discovery",
  "analysis",
  "matching",
  "compose",
  "generation",
  "agent",
  "validation",
  "no_match",
]);
/** Cache stages only matter when they answered. */
const HIT_ONLY = new Set(["exact_cache", "semantic_cache"]);

const MAX_STEPS = 24;

function settle(trace: TraceStep[]): TraceStep[] {
  return trace.map((step) => (step.status === "running" ? { ...step, status: "done" } : step));
}

function upsert(trace: TraceStep[], step: TraceStep): TraceStep[] {
  const index = trace.findIndex((item) => item.id === step.id);
  if (index === -1) return [...trace, step].slice(-MAX_STEPS);
  const next = trace.slice();
  next[index] = { ...trace[index], ...step, detail: { ...trace[index].detail, ...step.detail } };
  return next;
}

/** Folds one stream event into the message's step timeline. Unrelated events return the trace unchanged. */
export function applyTraceEvent(trace: TraceStep[], event: AdvisorEvent): TraceStep[] {
  switch (event.type) {
    case "step": {
      if (event.stage === "intent" && event.public) {
        // The intent belongs to "understanding the request"; it is not a step of its own.
        const understand = trace.find((item) => item.id === "stage:understand");
        return understand ? upsert(trace, { ...understand, detail: { ...event.public, ...understand.detail } }) : trace;
      }
      if (!VISIBLE_STAGES.has(event.stage)) return trace;
      if (HIT_ONLY.has(event.stage) && event.status !== "hit") return trace;
      if (event.stage === "retrieval" && event.status === "skipped") return trace;
      const status = event.status === "started" ? "running" : event.status === "unknown" ? "unknown" : "done";
      return upsert(settle(trace), { id: `stage:${event.stage}`, kind: "step", name: event.stage, status, detail: event.public });
    }
    case "thought":
      if (!event.text.trim()) return trace;
      return upsert(settle(trace), { id: `thought:${trace.length}`, kind: "thought", name: "thought", status: "done", text: event.text });
    case "tool_call": {
      const query = typeof event.arguments?.query === "string" ? event.arguments.query : undefined;
      return upsert(settle(trace), { id: `tool:${event.id ?? event.name}`, kind: "tool", name: event.name, status: "running", query });
    }
    case "tool_result": {
      const count = typeof event.result?.count === "number" ? event.result.count : undefined;
      return upsert(trace, { id: `tool:${event.id ?? event.name}`, kind: "tool", name: event.name, status: "done", count });
    }
    case "ask_user":
      return upsert(settle(trace), { id: "ask", kind: "ask", name: "ask_user", status: "done", text: event.question });
    case "final":
    case "error":
      return settle(trace);
    default:
      return trace;
  }
}
