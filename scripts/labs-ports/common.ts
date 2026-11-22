/**
 * Shared helpers for porting bespoke labs to the data-driven `dialogue` runtime.
 *
 * A port turns a bespoke lab (TypeScript graphs with lambda guards + a `score*()` function) into
 * data: an admin engine (context, meters, persona slots, constraints, rubric), library personas and
 * a scenario document. Lambda guards cannot be serialised, so every port lists their condition
 * equivalents by node id; `graphStage` refuses to export a graph with an unmapped guard.
 *
 * Proof of equivalence, per lab:
 * 1. Play: random choice paths are replayed through the bespoke engine (`model/dialogue.ts`) and the
 *    generic one (`model/dialogue-runtime.ts`) on the exported document; states must match.
 * 2. Score: the same runs are scored by the bespoke `score*()` and written as golden fixtures that
 *    the Python rubric must reproduce (`tests/unit/labs/test_dialogue_parity.py`).
 */
import assert from "node:assert/strict";

import type { LabCondition } from "../../src/features/labs/api/contract";
import { availableChoices, choose, startDialogue, type DialogueGraph, type DialogueState } from "../../src/features/labs/model/dialogue";
import {
  DialoguePlayer,
  type DialogueScenarioDoc,
  type DialogueStageDoc,
  type GuardDoc,
  type MeterSpec,
  type PersonaDoc,
  type RuntimeState,
} from "../../src/features/labs/model/dialogue-runtime";
import type { Scorecard } from "../../src/features/labs/model/types";

export type Rubric = Record<string, unknown>;

export type EngineSeed = {
  format: "mastery-lab-engine";
  format_version: 1;
  card: {
    key: string;
    runtime_key: "dialogue";
    name: { ar: string; en?: string };
    description: { ar: string; en?: string };
    icon: string;
    color: string;
    field_category_id?: number | null;
    sort_order?: number;
  };
  definition: {
    context: Record<string, unknown>;
    config: Record<string, unknown>;
    persona_slots: { slot: string; label: { ar: string; en?: string }; required?: boolean; default_persona_key?: string | null }[];
    constraints: Record<string, unknown>[];
    rubric: Rubric;
    starter_scenario?: DialogueScenarioDoc | null;
    notes?: string | null;
  };
};

export type PortCase = { name: string; run: Record<string, unknown>; expected: ExpectedScore };
export type ExpectedScore = {
  overall: number;
  dimensions: Record<string, number>;
  verdict: string;
  signals: Record<string, boolean>;
};

export type Port = {
  slug: string;
  engine: EngineSeed;
  personas: PersonaDoc[];
  scenarioKey: string;
  scenario: DialogueScenarioDoc;
  cases: PortCase[];
};

/** The three meters of the bespoke dialogue engine. */
export const CLASSIC_METERS: MeterSpec[] = [
  { key: "trust", label: { ar: "الثقة", en: "Trust" }, initial: 35, visible: true },
  { key: "patience", label: { ar: "الصبر", en: "Patience" }, initial: 70, visible: true },
  { key: "tension", label: { ar: "التوتر", en: "Tension" }, initial: 30, visible: true },
];

export const classicConfig = (turnCost: Record<string, number> = {}, showTalkRatio = false) => ({
  meters: CLASSIC_METERS,
  turn_cost: turnCost,
  persona_chars_per_second: 14,
  learner_chars_per_second: 12,
  max_hops: 20,
  show_meters: true,
  show_facts: true,
  show_clock: true,
  show_talk_ratio: showTalkRatio,
});

/** Guard conditions for a graph's lambdas: `redirect[node][i]` and `breakpoints[i]`. */
export type GuardMap = {
  redirect?: Record<string, LabCondition[][]>;
  breakpoints?: LabCondition[][];
};

/** `tagCount(s, ...tags) < n` has no single condition; most guards use one tag. */
export const tagLt = (tag: string, n: number): LabCondition => ({ left: `tags.${tag}`, op: "lt", right: n });
export const meter = (key: string, op: "gte" | "lte" | "gt" | "lt", value: number): LabCondition => ({ left: `meters.${key}`, op, right: value });

export function graphStage(
  graph: DialogueGraph,
  opts: { id: string; title?: string; notePrefix?: string | null; guards?: GuardMap },
): DialogueStageDoc {
  const guards = opts.guards ?? {};
  const toGuards = (rules: readonly { to: string }[] | undefined, mapped: LabCondition[][] | undefined, where: string): GuardDoc[] => {
    if (!rules?.length) return [];
    assert.ok(mapped && mapped.length === rules.length, `${graph.id}: map the ${rules.length} guard(s) of ${where}`);
    return rules.map((rule, index) => ({ when: mapped[index], to: rule.to }));
  };
  const nodes: DialogueStageDoc["nodes"] = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    nodes[id] = {
      id: node.id,
      speaker: node.speaker,
      line: node.line,
      ...(node.reveals?.length ? { reveals: [...node.reveals] } : {}),
      ...(node.effects && Object.keys(node.effects).length ? { effects: { ...node.effects } as Record<string, number> } : {}),
      ...(node.choices?.length
        ? {
            choices: node.choices.map((choice) => ({
              id: choice.id,
              label: choice.label,
              ...(choice.tags?.length ? { tags: [...choice.tags] } : {}),
              ...(choice.effects && Object.keys(choice.effects).length ? { effects: { ...choice.effects } as Record<string, number> } : {}),
              ...(choice.reveals?.length ? { reveals: [...choice.reveals] } : {}),
              ...(choice.requires?.length ? { requires: [...choice.requires] } : {}),
              next: choice.next,
              ...(choice.note ? { note: { tone: choice.note.tone as "good" | "bad" | "info", text: choice.note.text } } : {}),
              ...(choice.seconds != null ? { seconds: choice.seconds } : {}),
            })),
          }
        : {}),
      ...(node.next ? { next: node.next } : {}),
      ...(node.redirect?.length ? { redirect: toGuards(node.redirect, guards.redirect?.[id], `node "${id}"`) } : {}),
      ...(node.end ? { end: node.end } : {}),
    };
  }
  for (const id of Object.keys(guards.redirect ?? {})) assert.ok(graph.nodes[id]?.redirect, `${graph.id}: guard map names "${id}" which has no redirect`);
  return {
    id: opts.id,
    type: "dialogue",
    title: opts.title ?? graph.title,
    ...(opts.notePrefix ? { note_prefix: opts.notePrefix } : {}),
    start: graph.start,
    nodes,
    initial: { ...graph.initial },
    visible_meters: [...graph.visibleMeters],
    ...(graph.turnCost ? { turn_cost: { ...graph.turnCost } as Record<string, number> } : {}),
    ...(graph.breakpoints?.length ? { breakpoints: toGuards(graph.breakpoints, guards.breakpoints, "breakpoints") } : {}),
  };
}

/** Deterministic PRNG (mulberry32) so ports are reproducible. */
export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)];
export const sample = <T>(random: () => number, items: readonly T[]): T[] => items.filter(() => random() < 0.5);

/** A random walk through the bespoke graph; `bias` (0–1) prefers the first choice (often the best). */
export function walk(graph: DialogueGraph, random: () => number, bias = 0): { state: DialogueState; choices: string[] } {
  let state = startDialogue(graph);
  const choices: string[] = [];
  for (let step = 0; step < 80 && !state.outcome; step++) {
    const options = availableChoices(graph, state);
    if (!options.length) break;
    const choice = random() < bias ? options[0] : pick(random, options);
    choices.push(choice.id);
    state = choose(graph, state, choice.id);
  }
  return { state, choices };
}

/** The generic engine must play a path exactly like the bespoke one. */
export function assertSamePlay(label: string, doc: DialogueScenarioDoc, stage: DialogueStageDoc, bespoke: DialogueState, choices: string[]): RuntimeState {
  const generic = new DialoguePlayer(doc, stage).replay(choices);
  assert.deepEqual(generic.meters, bespoke.meters, `${label}: meters`);
  assert.deepEqual(generic.facts, bespoke.facts, `${label}: facts`);
  assert.deepEqual(generic.tags, bespoke.tags, `${label}: tags`);
  assert.equal(generic.outcome, bespoke.outcome, `${label}: outcome`);
  assert.equal(generic.clock, bespoke.clock, `${label}: clock`);
  assert.deepEqual(generic.talk, bespoke.talk, `${label}: talk`);
  assert.deepEqual(
    generic.transcript.map((entry) => [entry.who, entry.text, entry.at, entry.note?.text ?? null]),
    bespoke.transcript.map((entry) => [entry.who, entry.text, entry.at, entry.note?.text ?? null]),
    `${label}: transcript`,
  );
  return generic;
}

export function expected(scorecard: Scorecard, signals: Record<string, boolean>): ExpectedScore {
  return {
    overall: scorecard.overall,
    dimensions: Object.fromEntries(scorecard.dimensions.map((d) => [d.key, d.score])),
    verdict: scorecard.verdict,
    signals,
  };
}

// ---------- rubric builders (shapes of `app/modules/labs/domain/rubric.py`) ----------

export const c = (left: string, op: string, right?: unknown): LabCondition => ({ left, op: op as "eq", right });
export const T = {
  const: (points: number) => ({ kind: "const", points }),
  count: (source: string, per: number, extra: { among?: string[]; cap?: number } = {}) => ({ kind: "count", source, per, ...extra }),
  tags: (tags: string[], per: number, extra: { cap?: number; stage?: string } = {}) => ({ kind: "tags", tags, per, ...extra }),
  value: (source: string, scale = 1, offset = 0) => ({ kind: "value", source, scale, offset }),
  if: (when: LabCondition[], points: number, extra: { any?: LabCondition[]; else_points?: number } = {}) => ({ kind: "if", when, points, ...extra }),
  range: (source: string, low: number, high: number, inside: number, outside_per: number) => ({ kind: "range", source, low, high, inside, outside_per }),
  group: (terms: unknown[], min?: number, max?: number) => ({ kind: "group", terms, ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) }),
};

export function persona(
  key: string,
  name: string,
  role: string,
  profile: NonNullable<PersonaDoc["profile"]> & { hidden_facts?: string[]; system_prompt?: string },
  tags: string[] = [],
): PersonaDoc {
  return { key, name, role, profile, tags };
}
