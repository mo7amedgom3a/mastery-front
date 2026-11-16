/**
 * Crisis war-room engine: a fixed schedule of rounds (simulated hours), each with events that may
 * depend on earlier decisions, and a deck of decision cards. Cards move five stakeholder meters.
 * Deterministic: the same decisions always produce the same feed and meters.
 */

export type Stakeholder = "customers" | "regulator" | "media" | "staff" | "cash";
export type StakeMeters = Record<Stakeholder, number>;

export const stakeholderLabels: Record<Stakeholder, string> = {
  customers: "ثقة العملاء",
  regulator: "موقف الجهة التنظيمية",
  media: "الصورة الإعلامية",
  staff: "تماسك الفريق",
  cash: "الأثر المالي",
};

export type CrisisCard = {
  id: string;
  label: string;
  detail: string;
  effects: Partial<StakeMeters>;
  tags?: readonly string[];
  /** Observer note in the debrief. */
  note?: { tone: "good" | "bad" | "info"; text: string };
};

export type CrisisDecision = { round: number; hour: number; card: string };

export type CrisisState = {
  round: number;
  meters: StakeMeters;
  decisions: CrisisDecision[];
  done: boolean;
};

export type CrisisRound<E> = {
  hour: number;
  title: string;
  /** Events for this round given every earlier decision. */
  events: (decided: ReadonlySet<string>) => E[];
  /** Cards offered this round (cards already played are hidden). */
  cards: readonly string[];
  /** How many cards the learner may play this round. */
  picks: number;
};

const bound = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function startCrisis(initial: StakeMeters): CrisisState {
  return { round: 0, meters: { ...initial }, decisions: [], done: false };
}

export function decided(state: CrisisState): Set<string> {
  return new Set(state.decisions.map((d) => d.card));
}

/** Plays the chosen cards for the current round and advances the clock. */
export function playRound<E>(
  rounds: readonly CrisisRound<E>[],
  deck: Readonly<Record<string, CrisisCard>>,
  state: CrisisState,
  picks: readonly string[],
): CrisisState {
  if (state.done) return state;
  const round = rounds[state.round];
  const meters = { ...state.meters };
  const played = decided(state);
  const valid = picks.filter((id) => round.cards.includes(id) && !played.has(id) && deck[id]).slice(0, round.picks);
  for (const id of valid) {
    for (const [key, value] of Object.entries(deck[id].effects) as [Stakeholder, number][]) meters[key] = bound(meters[key] + value);
  }
  const next = state.round + 1;
  return {
    round: next,
    meters,
    decisions: [...state.decisions, ...valid.map((card) => ({ round: state.round, hour: round.hour, card }))],
    done: next >= rounds.length,
  };
}

/** Every event shown so far, in order, with the decisions known at each round. */
export function feedSoFar<E>(rounds: readonly CrisisRound<E>[], state: CrisisState): E[] {
  const items: E[] = [];
  const upto = Math.min(state.round, rounds.length - 1);
  for (let i = 0; i <= upto; i++) {
    const known = new Set(state.decisions.filter((d) => d.round < i).map((d) => d.card));
    items.push(...rounds[i].events(known));
  }
  return items;
}

/** Hour a card was played, or null. */
export function hourOf(state: CrisisState, card: string): number | null {
  return state.decisions.find((d) => d.card === card)?.hour ?? null;
}
