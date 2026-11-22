/**
 * The generic, data-driven dialogue runtime (mirror of the backend `dialogue` runtime in
 * `app/modules/labs/domain/engines/dialogue/`).
 *
 * Admin engines (sales, HR, support…) author scenarios as JSON: a pipeline of stages (briefings,
 * pick-lists, scripted dialogues, forms). Guards are `LabCondition`s, not functions, and meters are
 * defined by the engine. Timing, meter and redirect rules match `model/dialogue.ts` step for step,
 * so a ported lab plays exactly like its bespoke original. Scoring happens on the server.
 */
import type { LabCondition, LocalizedText } from "../api/contract";
import { evaluateCondition, evaluateConditions, type ConditionContext } from "./conditions";

export type Outcome = "success" | "neutral" | "fail";
export type NoteTone = "good" | "bad" | "info";
export type PersonaTone = "coral" | "sky" | "purple" | "teal" | "yellow" | "pink" | "green" | "blue";

export type SpeakerRef = {
  slot?: string | null;
  persona?: string | null;
  name?: string | null;
  role?: string | null;
  initials?: string | null;
  tone?: PersonaTone | null;
};

export type MeterSpec = { key: string; label: LocalizedText; initial: number; visible?: boolean; min?: number; max?: number };
export type FactSpec = { id: string; label: string };

export type DialogueChoiceDoc = {
  id: string;
  label: string;
  tags?: string[];
  effects?: Record<string, number>;
  reveals?: string[];
  requires?: string[];
  next: string;
  note?: { tone: NoteTone; text: string } | null;
  seconds?: number | null;
};

export type GuardDoc = { when?: LabCondition[]; any?: LabCondition[]; to: string };

export type DialogueNodeDoc = {
  id: string;
  speaker: string;
  line: string;
  reveals?: string[];
  effects?: Record<string, number>;
  choices?: DialogueChoiceDoc[];
  next?: string | null;
  redirect?: GuardDoc[];
  end?: Outcome | null;
};

export type BriefStage = {
  id: string;
  type: "brief";
  title: string;
  body?: string;
  documents?: { title: string; body: string }[];
};

export type SelectStage = {
  id: string;
  type: "select";
  title: string;
  prompt?: string;
  multiple?: boolean;
  min_select?: number;
  max_select?: number | null;
  options: { id: string; label: string; detail?: string | null; tags?: string[]; correct?: boolean | null }[];
};

export type FormFieldDoc = {
  id: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "select" | "multiselect";
  options?: { id: string; label: string }[];
  unit?: string | null;
  required?: boolean;
  placeholder?: string | null;
};

export type FormStage = { id: string; type: "form"; title: string; prompt?: string; fields: FormFieldDoc[] };

export type DialogueStageDoc = {
  id: string;
  type: "dialogue";
  title: string;
  note_prefix?: string | null;
  start: string;
  nodes: Record<string, DialogueNodeDoc>;
  initial?: Record<string, number>;
  visible_meters?: string[] | null;
  turn_cost?: Record<string, number>;
  breakpoints?: GuardDoc[];
};

export type StageDoc = BriefStage | SelectStage | DialogueStageDoc | FormStage;

export type DialogueConfig = {
  meters?: MeterSpec[];
  turn_cost?: Record<string, number>;
  persona_chars_per_second?: number;
  learner_chars_per_second?: number;
  max_hops?: number;
  show_meters?: boolean;
  show_facts?: boolean;
  show_clock?: boolean;
  show_talk_ratio?: boolean;
};

export type PersonaDoc = {
  key: string;
  name: string;
  role: string;
  profile?: {
    name_en?: string | null;
    role_en?: string | null;
    initials?: string;
    tone?: PersonaTone;
    avatar_url?: string | null;
    organization?: string | null;
    personality?: string;
    traits?: string[];
    goals?: string[];
    speaking_style?: string;
  };
  tags?: string[];
};

export type ResolvedEngineDoc = {
  key: string;
  version_no?: number;
  runtime: string;
  name: LocalizedText;
  context?: { domain?: string; setting?: string; learner_role?: string; tone?: string; glossary?: string[] };
  config?: DialogueConfig;
  constraints?: { key: string; label: LocalizedText; type?: string; value?: unknown; unit?: string | null }[];
  personas?: Record<string, PersonaDoc>;
  slots?: Record<string, string>;
};

export type DialogueScenarioDoc = {
  intro?: string | null;
  speakers: Record<string, SpeakerRef>;
  meters?: MeterSpec[];
  facts?: FactSpec[];
  stages: StageDoc[];
  constraints?: Record<string, unknown>;
  engine?: ResolvedEngineDoc | null;
};

export type TranscriptEntry = { id: number; who: string; text: string; at: number; note?: { tone: NoteTone; text: string } | null };

export type RuntimeState = {
  nodeId: string;
  meters: Record<string, number>;
  facts: string[];
  tags: Record<string, number>;
  transcript: TranscriptEntry[];
  clock: number;
  talk: { learner: number; persona: number };
  turns: number;
  outcome: Outcome | null;
  visited: string[];
  choices: string[];
};

export type ResolvedSpeaker = {
  id: string;
  name: string;
  role: string;
  initials: string;
  tone: PersonaTone;
  avatarUrl?: string | null;
  personality?: string;
  traits?: string[];
};

const DEFAULT_METERS: MeterSpec[] = [
  { key: "trust", label: { ar: "الثقة", en: "Trust" }, initial: 35 },
  { key: "patience", label: { ar: "الصبر", en: "Patience" }, initial: 70 },
  { key: "tension", label: { ar: "التوتر", en: "Tension" }, initial: 30, visible: false },
];

export function metersOf(doc: DialogueScenarioDoc): MeterSpec[] {
  if (doc.meters?.length) return doc.meters;
  return doc.engine?.config?.meters?.length ? doc.engine.config.meters : DEFAULT_METERS;
}

function configOf(doc: DialogueScenarioDoc) {
  const config = doc.engine?.config ?? {};
  return {
    turnCost: config.turn_cost ?? {},
    personaCps: config.persona_chars_per_second ?? 14,
    learnerCps: config.learner_chars_per_second ?? 12,
    maxHops: config.max_hops ?? 20,
  };
}

/** Speaker id → display persona, resolving engine slots and library personas. */
export function resolveSpeakers(doc: DialogueScenarioDoc): Record<string, ResolvedSpeaker> {
  const personas = doc.engine?.personas ?? {};
  const slots = doc.engine?.slots ?? {};
  const out: Record<string, ResolvedSpeaker> = {};
  for (const [id, ref] of Object.entries(doc.speakers)) {
    const key = ref.persona || (ref.slot ? slots[ref.slot] : undefined);
    const persona = key ? personas[key] : undefined;
    const name = ref.name || persona?.name || id;
    out[id] = {
      id,
      name,
      role: ref.role || persona?.role || "",
      initials: ref.initials || persona?.profile?.initials || name.split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join(""),
      tone: ref.tone || persona?.profile?.tone || "sky",
      avatarUrl: persona?.profile?.avatar_url ?? null,
      personality: persona?.profile?.personality,
      traits: persona?.profile?.traits,
    };
  }
  return out;
}

/** Tag counts where a missing tag reads 0 (like `tagCount`). */
function counts(tags: Record<string, number>): Record<string, number> {
  return new Proxy(tags, { get: (target, key) => (typeof key === "string" ? (target[key] ?? 0) : undefined) });
}

export function stateContext(state: RuntimeState): ConditionContext {
  const total = state.talk.learner + state.talk.persona;
  return {
    node: state.nodeId,
    meters: state.meters,
    facts: state.facts,
    fact: Object.fromEntries(state.facts.map((fact) => [fact, true])),
    tags: counts(state.tags),
    turns: state.turns,
    clock: state.clock,
    visited: state.visited,
    outcome: state.outcome,
    talk_share: total ? Math.round((state.talk.learner / total) * 100) : 0,
  };
}

function passes(rule: GuardDoc, context: ConditionContext): boolean {
  if (!evaluateConditions(rule.when, context)) return false;
  return !rule.any?.length || rule.any.some((condition) => evaluateCondition(condition, context));
}

function estimateSeconds(text: string, charsPerSecond: number): number {
  return Math.max(3, Math.round(text.length / charsPerSecond));
}

export class DialoguePlayer {
  private readonly specs: Map<string, MeterSpec>;
  private readonly cfg: ReturnType<typeof configOf>;
  private readonly turnCost: Record<string, number>;

  constructor(
    readonly doc: DialogueScenarioDoc,
    readonly stage: DialogueStageDoc,
  ) {
    this.specs = new Map(metersOf(doc).map((spec) => [spec.key, spec]));
    this.cfg = configOf(doc);
    this.turnCost = stage.turn_cost && Object.keys(stage.turn_cost).length ? stage.turn_cost : this.cfg.turnCost;
  }

  private apply(meters: Record<string, number>, effects?: Record<string, number>): Record<string, number> {
    if (!effects) return meters;
    const next = { ...meters };
    for (const [key, delta] of Object.entries(effects)) {
      if (!(key in next)) continue;
      const spec = this.specs.get(key);
      next[key] = Math.max(spec?.min ?? 0, Math.min(spec?.max ?? 100, next[key] + (delta ?? 0)));
    }
    return next;
  }

  start(): RuntimeState {
    const meters: Record<string, number> = {};
    for (const spec of this.specs.values()) meters[spec.key] = spec.initial;
    for (const [key, value] of Object.entries(this.stage.initial ?? {})) if (key in meters) meters[key] = value;
    return this.enter(
      { nodeId: this.stage.start, meters, facts: [], tags: {}, transcript: [], clock: 0, talk: { learner: 0, persona: 0 }, turns: 0, outcome: null, visited: [], choices: [] },
      this.stage.start,
    );
  }

  private enter(state: RuntimeState, id: string): RuntimeState {
    let current = state;
    let target: string | undefined = id;
    for (let hop = 0; target && hop < this.cfg.maxHops; hop++) {
      const node: DialogueNodeDoc | undefined = this.stage.nodes[target];
      if (!node) throw new Error(`Dialogue ${this.stage.id}: unknown node "${target}"`);
      const context = stateContext(current);
      const redirect: GuardDoc | undefined = (node.redirect ?? []).find((rule) => passes(rule, context));
      if (redirect) {
        target = redirect.to;
        continue;
      }
      const seconds = estimateSeconds(node.line, this.cfg.personaCps);
      current = {
        ...current,
        nodeId: node.id,
        meters: this.apply(current.meters, node.effects),
        facts: addFacts(current.facts, node.reveals),
        clock: current.clock + seconds,
        talk: { ...current.talk, persona: current.talk.persona + seconds },
        transcript: [...current.transcript, { id: current.transcript.length, who: node.speaker, text: node.line, at: current.clock }],
        outcome: node.end ?? null,
        visited: [...current.visited, node.id],
      };
      target = node.end ? undefined : node.choices?.length ? undefined : (node.next ?? undefined);
    }
    return current;
  }

  available(state: RuntimeState): DialogueChoiceDoc[] {
    if (state.outcome) return [];
    const node = this.stage.nodes[state.nodeId];
    return (node?.choices ?? []).filter((choice) => (choice.requires ?? []).every((fact) => state.facts.includes(fact)));
  }

  choose(state: RuntimeState, choiceId: string): RuntimeState {
    const choice = this.available(state).find((item) => item.id === choiceId);
    if (!choice) return state;
    const seconds = choice.seconds ?? estimateSeconds(choice.label, this.cfg.learnerCps);
    const tags = { ...state.tags };
    for (const tag of choice.tags ?? []) tags[tag] = (tags[tag] ?? 0) + 1;
    const after: RuntimeState = {
      ...state,
      meters: this.apply(this.apply(state.meters, this.turnCost), choice.effects),
      facts: addFacts(state.facts, choice.reveals),
      tags,
      clock: state.clock + seconds,
      talk: { ...state.talk, learner: state.talk.learner + seconds },
      turns: state.turns + 1,
      transcript: [...state.transcript, { id: state.transcript.length, who: "learner", text: choice.label, at: state.clock, note: choice.note ?? null }],
      choices: [...state.choices, choice.id],
    };
    const context = stateContext(after);
    const breakpoint = (this.stage.breakpoints ?? []).find((rule) => passes(rule, context));
    return this.enter(after, breakpoint ? breakpoint.to : choice.next);
  }

  replay(choiceIds: readonly string[]): RuntimeState {
    let state = this.start();
    for (const id of choiceIds) {
      if (state.outcome) break;
      state = this.choose(state, id);
    }
    return state;
  }
}

function addFacts(facts: string[], reveals?: readonly string[]): string[] {
  if (!reveals?.length) return facts;
  return [...new Set([...facts, ...reveals])];
}

export function learnerShare(state: RuntimeState): number {
  const total = state.talk.learner + state.talk.persona;
  return total ? Math.round((state.talk.learner / total) * 100) : 0;
}

/** The run the server replays and scores: `{stages: {<id>: {choices | selected | values}}}`. */
export type DialogueRun = {
  stages: Record<string, { choices?: string[]; selected?: string[]; values?: Record<string, unknown> }>;
};

/** Every edge out of a node (used by the graph validator). */
function edgesOf(stage: DialogueStageDoc, node: DialogueNodeDoc): string[] {
  return [
    ...(node.choices ?? []).map((choice) => choice.next),
    ...(node.redirect ?? []).map((rule) => rule.to),
    ...(node.next ? [node.next] : []),
    ...(node.choices?.length ? (stage.breakpoints ?? []).map((rule) => rule.to) : []),
  ];
}

/** Structural problems of a dialogue stage (dangling ids, dead ends, unreachable nodes). */
export function validateStage(doc: DialogueScenarioDoc, stage: DialogueStageDoc): string[] {
  const problems: string[] = [];
  if (!stage.nodes[stage.start]) problems.push(`${stage.id}: start "${stage.start}" missing`);
  for (const [id, node] of Object.entries(stage.nodes)) {
    if (node.id !== id) problems.push(`${stage.id}: node key "${id}" has id "${node.id}"`);
    if (!doc.speakers[node.speaker]) problems.push(`${stage.id}: node "${id}" speaker "${node.speaker}" unknown`);
    if (!node.end && !node.choices?.length && !node.next && !node.redirect?.length) problems.push(`${stage.id}: node "${id}" is a dead end`);
    for (const to of edgesOf(stage, node)) if (!stage.nodes[to]) problems.push(`${stage.id}: node "${id}" → unknown "${to}"`);
  }
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id) || !stage.nodes[id]) return;
    seen.add(id);
    for (const to of edgesOf(stage, stage.nodes[id])) visit(to);
  };
  visit(stage.start);
  for (const id of Object.keys(stage.nodes)) if (!seen.has(id)) problems.push(`${stage.id}: node "${id}" unreachable`);
  return problems;
}
