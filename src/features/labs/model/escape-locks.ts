/**
 * Escape-room engine: a sequence of locks, each opened by a numeric code computed from evidence.
 * Time is simulated minutes: working a lock, wrong codes and hints all cost minutes, so the
 * result is deterministic and replayable.
 */

export type Lock = {
  id: string;
  title: string;
  /** Digits only; the learner's input is normalised the same way. */
  code: string;
  /** Minutes the analysis itself takes. */
  work: number;
  hints: readonly string[];
};

export const ROOM_MINUTES = 45;
export const HINT_COST = 4;
export const WRONG_COST = 2;

export type LockProgress = { solved: boolean; wrong: number; hints: number; skipped: boolean };
export type RoomState = { index: number; progress: Record<string, LockProgress>; used: number; over: boolean };

export function startRoom(): RoomState {
  return { index: 0, progress: {}, used: 0, over: false };
}

export const normalize = (code: string) => code.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^\d]/g, "");

const progressOf = (state: RoomState, id: string): LockProgress => state.progress[id] ?? { solved: false, wrong: 0, hints: 0, skipped: false };

function advance(locks: readonly Lock[], state: RoomState, used: number, progress: Record<string, LockProgress>, move: boolean): RoomState {
  const over = used >= ROOM_MINUTES;
  const index = move ? state.index + 1 : state.index;
  return { index, progress, used: Math.min(used, ROOM_MINUTES), over: over || index >= locks.length };
}

export function tryCode(locks: readonly Lock[], state: RoomState, input: string): { state: RoomState; correct: boolean } {
  if (state.over) return { state, correct: false };
  const lock = locks[state.index];
  const p = progressOf(state, lock.id);
  if (normalize(input) === lock.code) {
    const progress = { ...state.progress, [lock.id]: { ...p, solved: true } };
    return { state: advance(locks, state, state.used + lock.work, progress, true), correct: true };
  }
  const progress = { ...state.progress, [lock.id]: { ...p, wrong: p.wrong + 1 } };
  return { state: advance(locks, state, state.used + WRONG_COST, progress, false), correct: false };
}

export function takeHint(locks: readonly Lock[], state: RoomState): RoomState {
  if (state.over) return state;
  const lock = locks[state.index];
  const p = progressOf(state, lock.id);
  if (p.hints >= lock.hints.length) return state;
  const progress = { ...state.progress, [lock.id]: { ...p, hints: p.hints + 1 } };
  return advance(locks, state, state.used + HINT_COST, progress, false);
}

export function skipLock(locks: readonly Lock[], state: RoomState): RoomState {
  if (state.over) return state;
  const lock = locks[state.index];
  const progress = { ...state.progress, [lock.id]: { ...progressOf(state, lock.id), skipped: true } };
  return advance(locks, state, state.used + lock.work, progress, true);
}

export function roomSummary(locks: readonly Lock[], state: RoomState) {
  const all = locks.map((lock) => progressOf(state, lock.id));
  return {
    solved: all.filter((p) => p.solved).length,
    wrong: all.reduce((s, p) => s + p.wrong, 0),
    hints: all.reduce((s, p) => s + p.hints, 0),
    left: Math.max(0, ROOM_MINUTES - state.used),
  };
}

export function hintsShown(locks: readonly Lock[], state: RoomState, id: string): readonly string[] {
  const lock = locks.find((l) => l.id === id);
  return lock ? lock.hints.slice(0, progressOf(state, id).hints) : [];
}
