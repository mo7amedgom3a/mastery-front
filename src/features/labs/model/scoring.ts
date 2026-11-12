import type { Dimension, Highlight, QuizOption, QuizQuestion, QuizResult, BehaviourStyle, Readiness, Scorecard } from "./types";

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** 0–100, rounded. */
export function pct(value: number): number {
  return Math.round(clamp(value));
}

export function readinessFor(overall: number): Readiness {
  if (overall >= 80) return "متميّز";
  if (overall >= 60) return "جاهز";
  return "مبتدئ";
}

/** Weighted average of the dimensions, then strengths (top, ≥ 75) and tips (lowest three). */
export function buildScorecard(input: { dimensions: Dimension[]; highlights: Highlight[]; verdict: string }): Scorecard {
  const dimensions = input.dimensions.map((dimension) => ({ ...dimension, score: pct(dimension.score) }));
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0) || 1;
  const overall = pct(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight);
  const strengths = [...dimensions]
    .filter((d) => d.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((d) => d.praise);
  const tips = [...dimensions]
    .filter((d) => d.score < 85)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => d.tip);
  return {
    overall,
    readiness: readinessFor(overall),
    dimensions,
    highlights: input.highlights,
    strengths,
    tips,
    verdict: input.verdict,
  };
}

/** XP for an attempt: showing up counts, quality counts more, badges add a bonus. */
export function xpFor(overall: number, newBadges: number): number {
  return 50 + Math.round(overall * 2) + newBadges * 50;
}

/** Score of answered quiz questions as a percentage, plus the dominant behaviour style. */
export function scoreQuiz(questions: readonly QuizQuestion[], answers: readonly number[]): QuizResult {
  const picked = questions
    .map((question, index) => question.options[answers[index]])
    .filter((option): option is QuizOption => Boolean(option));
  const max = questions.length * 2 || 1;
  const points = picked.reduce((sum, option) => sum + option.points, 0);
  const tally = new Map<BehaviourStyle, number>();
  for (const option of picked) {
    if (option.style) tally.set(option.style, (tally.get(option.style) ?? 0) + 1);
  }
  let style: BehaviourStyle | null = null;
  let best = 0;
  for (const [key, count] of tally) {
    if (count > best) {
      best = count;
      style = key;
    }
  }
  return { percent: pct((points / max) * 100), style };
}

/** "02:45" from seconds. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
