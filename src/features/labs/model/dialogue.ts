/**
 * A scripted, deterministic dialogue engine: the "actor" side of a simulation without an LLM.
 *
 * A graph of persona nodes; the learner answers with choices that carry hidden tags and meter
 * effects. Guards (`redirect`, `breakpoints`) let the scenario react to state, e.g. a buyer who
 * hangs up when patience runs out. The engine also records everything the "observer" scorecard
 * needs: transcript with simulated timestamps, discovered facts, tag counts and talk time.
 */
import type { HighlightTone } from "./types";

export type Meter = "trust" | "patience" | "tension";
export type Meters = Record<Meter, number>;

export type DialogueChoice = {
  id: string;
  label: string;
  tags?: readonly string[];
  effects?: Partial<Meters>;
  reveals?: readonly string[];
  /** Shown only when every listed fact has been discovered (rewards earlier discovery). */
  requires?: readonly string[];
  next: string;
  /** Observer note recorded on the transcript when this choice is taken. */
  note?: { tone: HighlightTone; text: string };
  /** Simulated learner talk time; defaults to an estimate from the label length. */
  seconds?: number;
};

export type DialogueNode = {
  id: string;
  /** Persona id from the graph's `personas`. */
  speaker: string;
  line: string;
  reveals?: readonly string[];
  effects?: Partial<Meters>;
  choices?: readonly DialogueChoice[];
  /** No choices: continue to this node after the line (a second speaker, a beat). */
  next?: string;
  /** Checked on entry, first match wins. */
  redirect?: readonly { when: (state: DialogueState) => boolean; to: string }[];
  end?: DialogueOutcome;
};

export type DialogueOutcome = "success" | "neutral" | "fail";

export type Persona = { name: string; role: string; initials: string; tone: "coral" | "sky" | "purple" | "teal" | "yellow" | "pink" | "green" };

export type DialogueGraph = {
  id: string;
  title: string;
  start: string;
  personas: Record<string, Persona>;
  initial: Meters;
  /** Meters shown to the learner during the session. */
  visibleMeters: readonly Meter[];
  /** Checked after every learner turn; first match wins (e.g. patience ≤ 0 → hang up). */
  breakpoints?: readonly { when: (state: DialogueState) => boolean; to: string }[];
  /** Patience every learner turn costs (time pressure). */
  turnCost?: Partial<Meters>;
  nodes: Record<string, DialogueNode>;
};

export type TranscriptEntry = {
  id: number;
  who: "learner" | string;
  text: string;
  /** Simulated seconds since the session started. */
  at: number;
  note?: { tone: HighlightTone; text: string };
};

export type DialogueState = {
  nodeId: string;
  meters: Meters;
  facts: string[];
  tags: Record<string, number>;
  transcript: TranscriptEntry[];
  clock: number;
  talk: { learner: number; persona: number };
  turns: number;
  outcome: DialogueOutcome | null;
};

const MAX_HOPS = 20;

function estimateSeconds(text: string, charsPerSecond: number): number {
  return Math.max(3, Math.round(text.length / charsPerSecond));
}

function applyEffects(meters: Meters, effects?: Partial<Meters>): Meters {
  if (!effects) return meters;
  const next = { ...meters };
  for (const key of Object.keys(effects) as Meter[]) {
    next[key] = Math.max(0, Math.min(100, next[key] + (effects[key] ?? 0)));
  }
  return next;
}

function addFacts(facts: string[], reveals?: readonly string[]): string[] {
  if (!reveals?.length) return facts;
  return [...new Set([...facts, ...reveals])];
}

/** Enters `id`: follows redirects and `next` chains, appending each persona line. */
function enter(graph: DialogueGraph, state: DialogueState, id: string): DialogueState {
  let current = state;
  let target: string | undefined = id;
  for (let hop = 0; target && hop < MAX_HOPS; hop++) {
    const node: DialogueNode | undefined = graph.nodes[target];
    if (!node) throw new Error(`Dialogue ${graph.id}: unknown node "${target}"`);
    const redirect: { to: string } | undefined = node.redirect?.find((rule) => rule.when(current));
    if (redirect) {
      target = redirect.to;
      continue;
    }
    const seconds = estimateSeconds(node.line, 14);
    current = {
      ...current,
      nodeId: node.id,
      meters: applyEffects(current.meters, node.effects),
      facts: addFacts(current.facts, node.reveals),
      clock: current.clock + seconds,
      talk: { ...current.talk, persona: current.talk.persona + seconds },
      transcript: [...current.transcript, { id: current.transcript.length, who: node.speaker, text: node.line, at: current.clock }],
      outcome: node.end ?? null,
    };
    target = node.end ? undefined : node.choices?.length ? undefined : node.next;
  }
  return current;
}

export function startDialogue(graph: DialogueGraph): DialogueState {
  return enter(
    graph,
    {
      nodeId: graph.start,
      meters: { ...graph.initial },
      facts: [],
      tags: {},
      transcript: [],
      clock: 0,
      talk: { learner: 0, persona: 0 },
      turns: 0,
      outcome: null,
    },
    graph.start,
  );
}

/** Choices the learner can pick at the current node (facts-gated ones hidden until discovered). */
export function availableChoices(graph: DialogueGraph, state: DialogueState): DialogueChoice[] {
  if (state.outcome) return [];
  const node = graph.nodes[state.nodeId];
  return (node?.choices ?? []).filter((choice) => (choice.requires ?? []).every((fact) => state.facts.includes(fact)));
}

export function choose(graph: DialogueGraph, state: DialogueState, choiceId: string): DialogueState {
  const choice = availableChoices(graph, state).find((item) => item.id === choiceId);
  if (!choice) return state;
  const seconds = choice.seconds ?? estimateSeconds(choice.label, 12);
  const tags = { ...state.tags };
  for (const tag of choice.tags ?? []) tags[tag] = (tags[tag] ?? 0) + 1;
  const afterTurn: DialogueState = {
    ...state,
    meters: applyEffects(applyEffects(state.meters, graph.turnCost), choice.effects),
    facts: addFacts(state.facts, choice.reveals),
    tags,
    clock: state.clock + seconds,
    talk: { ...state.talk, learner: state.talk.learner + seconds },
    turns: state.turns + 1,
    transcript: [
      ...state.transcript,
      { id: state.transcript.length, who: "learner", text: choice.label, at: state.clock, note: choice.note },
    ],
  };
  const breakpoint = graph.breakpoints?.find((rule) => rule.when(afterTurn));
  return enter(graph, afterTurn, breakpoint ? breakpoint.to : choice.next);
}

/** Share of talk time that was the learner's, 0–100. */
export function learnerTalkShare(state: DialogueState): number {
  const total = state.talk.learner + state.talk.persona;
  return total ? Math.round((state.talk.learner / total) * 100) : 0;
}

export function tagCount(state: DialogueState, ...names: string[]): number {
  return names.reduce((sum, name) => sum + (state.tags[name] ?? 0), 0);
}

/** Every edge out of a node, including guards: used by the graph validator. */
export function edgesOf(graph: DialogueGraph, node: DialogueNode): string[] {
  return [
    ...(node.choices ?? []).map((choice) => choice.next),
    ...(node.redirect ?? []).map((rule) => rule.to),
    ...(node.next ? [node.next] : []),
    ...(node.choices?.length ? (graph.breakpoints ?? []).map((rule) => rule.to) : []),
  ];
}

/** Structural problems in a graph (empty when sound): dangling ids, unreachable nodes, dead ends, cycles. */
export function validateGraph(graph: DialogueGraph): string[] {
  const problems: string[] = [];
  const ids = Object.keys(graph.nodes);
  if (!graph.nodes[graph.start]) problems.push(`start "${graph.start}" missing`);
  for (const id of ids) {
    const node = graph.nodes[id];
    if (node.id !== id) problems.push(`node key "${id}" has id "${node.id}"`);
    if (!graph.personas[node.speaker]) problems.push(`node "${id}" speaker "${node.speaker}" unknown`);
    if (!node.end && !node.choices?.length && !node.next && !node.redirect?.length) problems.push(`node "${id}" is a dead end`);
    for (const to of edgesOf(graph, node)) if (!graph.nodes[to]) problems.push(`node "${id}" → unknown "${to}"`);
  }
  // Reachability + cycle detection (DFS colours).
  const colour = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]) => {
    const node = graph.nodes[id];
    if (!node) return;
    if (colour.get(id) === 1) {
      problems.push(`cycle: ${[...path, id].join(" → ")}`);
      return;
    }
    if (colour.get(id) === 2) return;
    colour.set(id, 1);
    for (const to of edgesOf(graph, node)) visit(to, [...path, id]);
    colour.set(id, 2);
  };
  visit(graph.start, []);
  for (const id of ids) if (!colour.has(id)) problems.push(`node "${id}" unreachable`);
  return problems;
}
