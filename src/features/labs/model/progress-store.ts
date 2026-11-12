"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { labs } from "./catalog";
import { xpFor } from "./scoring";
import {
  skillLabels,
  type BadgeId,
  type BadgeSignals,
  type Highlight,
  type LabResult,
  type LabSlug,
  type QuizResult,
  type Readiness,
  type Scorecard,
  type Skill,
} from "./types";

export const badgeInfo: Record<BadgeId, { label: string; text: string }> = {
  "first-lab": { label: "الخطوة الأولى", text: "أكملت أول مختبر عملي" },
  "budget-sniper": { label: "قنّاص الميزانية", text: "حققت أهداف الحملة دون تجاوز 100$" },
  "deal-closer": { label: "مُغلق الصفقات", text: "انتزعت اجتماعًا مؤكدًا مع صاحب القرار" },
  peacemaker: { label: "صانع السلام", text: "أنهيت الوساطة باتفاق مكتوب وتوتر منخفض" },
  "share-defender": { label: "حارس الحصة", text: "استعدت حصة السوق مع نقد يكفي 12 شهرًا على الأقل" },
  "cool-head": { label: "أعصاب باردة", text: "حوّلت عميلًا غاضبًا إلى عميل راضٍ دون تصعيد" },
  "deal-saver": { label: "منقذ الصفقات", text: "أعدت صفقة متعثرة إلى طاولة التفاوض" },
  "fair-terms": { label: "شروط عادلة", text: "عقد يقبله العميل ويحفظ هامش الشركة" },
  "objection-reader": { label: "قارئ الاعتراضات", text: "صنّفت كل اعتراضات المختبر بدقة" },
  "ruler-master": { label: "ميزان المسطرة", text: "طبّقت خطوات المسطرة الخمس دون مهاجمة المنافس" },
  "rejection-proof": { label: "ضد الرفض", text: "حوّلت رفضًا أوليًا إلى خطوة تالية" },
  "funnel-master": { label: "مهندس القمع", text: "خطة أسبوع متوازنة ومعادلة قمع صحيحة" },
  excellence: { label: "متميّز", text: "حصلت على 85 أو أكثر في مختبر" },
  "all-rounder": { label: "متعدّد المهارات", text: "أكملت كل المختبرات المتاحة" },
};

/** One scored axis of an attempt; `praise`/`tip` keep the observer's wording for the insights report. */
export type AttemptDimension = {
  key: string;
  label: string;
  score: number;
  skill: Skill;
  weight?: number;
  praise?: string;
  tip?: string;
};

export type Attempt = {
  id: string;
  slug: LabSlug;
  at: string;
  overall: number;
  readiness: Readiness;
  dimensions: AttemptDimension[];
  xp: number;
  badges: BadgeId[];
  /** Catalog category the lab belongs to, so insights can group practice by field. */
  categoryLegacyId: number;
  categoryName: string;
  /** Whole minutes spent in the attempt (0 for attempts recorded before the timer was stored). */
  minutes: number;
  /** The observer's timestamped moments, kept for the behaviour analysis. */
  highlights: Highlight[];
  /** Pre/post behaviour quizzes; the style shift is part of the profile. */
  pre: QuizResult | null;
  post: QuizResult | null;
  signals: BadgeSignals;
  /** 1-based attempt number within the same lab. */
  attemptNo: number;
};

type LabsProgress = {
  attempts: Attempt[];
  xp: number;
  badges: BadgeId[];
  /** Saves a finished attempt; returns the badges it newly earned and the XP awarded. */
  record: (
    slug: LabSlug,
    scorecard: Scorecard,
    signals: BadgeSignals,
    pre: QuizResult | null,
    post: QuizResult | null,
    elapsedSeconds: number,
  ) => { newBadges: BadgeId[]; xp: number };
  reset: () => void;
};

const MAX_ATTEMPTS = 60;

function earnedBadges(slug: LabSlug, scorecard: Scorecard, signals: BadgeSignals, attempts: Attempt[]): BadgeId[] {
  const earned: BadgeId[] = ["first-lab"];
  if (signals.marketingTargetMet) earned.push("budget-sniper");
  if (signals.dealClosed) earned.push("deal-closer");
  if (signals.peaceMade) earned.push("peacemaker");
  if (signals.shareDefended) earned.push("share-defender");
  if (signals.coolHead) earned.push("cool-head");
  if (signals.dealSaved) earned.push("deal-saver");
  if (signals.fairTerms) earned.push("fair-terms");
  if (signals.objectionReader) earned.push("objection-reader");
  if (signals.rulerMaster) earned.push("ruler-master");
  if (signals.rejectionProof) earned.push("rejection-proof");
  if (signals.funnelMaster) earned.push("funnel-master");
  if (scorecard.overall >= 85) earned.push("excellence");
  const done = new Set([...attempts.map((a) => a.slug), slug]);
  if (labs.every((lab) => done.has(lab.slug))) earned.push("all-rounder");
  return earned;
}

export const useLabsProgress = create<LabsProgress>()(
  persist(
    (set, get) => ({
      attempts: [],
      xp: 0,
      badges: [],
      record: (slug, scorecard, signals, pre, post, elapsedSeconds) => {
        const state = get();
        const lab = labs.find((entry) => entry.slug === slug);
        const newBadges = earnedBadges(slug, scorecard, signals, state.attempts).filter((b) => !state.badges.includes(b));
        const xp = xpFor(scorecard.overall, newBadges.length);
        const attempt: Attempt = {
          id: `${slug}-${Date.now()}`,
          slug,
          at: new Date().toISOString(),
          overall: scorecard.overall,
          readiness: scorecard.readiness,
          dimensions: scorecard.dimensions.map(({ key, label, score, skill, weight, praise, tip }) => ({
            key,
            label,
            score,
            skill,
            weight,
            praise,
            tip,
          })),
          xp,
          badges: newBadges,
          categoryLegacyId: lab?.categoryLegacyId ?? 0,
          categoryName: lab?.categoryName ?? "",
          minutes: Math.max(0, Math.round(elapsedSeconds / 60)),
          highlights: scorecard.highlights,
          pre,
          post,
          signals,
          attemptNo: state.attempts.filter((entry) => entry.slug === slug).length + 1,
        };
        set({
          attempts: [attempt, ...state.attempts].slice(0, MAX_ATTEMPTS),
          xp: state.xp + xp,
          badges: [...state.badges, ...newBadges],
        });
        return { newBadges, xp };
      },
      reset: () => set({ attempts: [], xp: 0, badges: [] }),
    }),
    {
      name: "ma-labs",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ attempts, xp, badges }) => ({ attempts, xp, badges }),
      /**
       * v1 attempts only kept the score and the axes. Fill the behaviour fields with honest
       * defaults instead of dropping a learner's history (highlights stay empty → no fake moments).
       */
      migrate: (persisted, version) => {
        const state = persisted as { attempts?: Partial<Attempt>[]; xp?: number; badges?: BadgeId[] } | undefined;
        if (!state || version >= 2) return persisted;
        const attempts = (state.attempts ?? [])
          .filter((attempt) => Boolean(attempt.slug))
          .map((attempt, index): Attempt => {
            const lab = labs.find((entry) => entry.slug === attempt.slug);
            return {
              ...attempt,
              slug: attempt.slug as LabSlug,
              id: attempt.id ?? `${attempt.slug}-${index}`,
              at: attempt.at ?? new Date().toISOString(),
              overall: attempt.overall ?? 0,
              readiness: attempt.readiness ?? "مبتدئ",
              dimensions: (attempt.dimensions ?? []) as AttemptDimension[],
              xp: attempt.xp ?? 0,
              badges: attempt.badges ?? [],
              categoryLegacyId: attempt.categoryLegacyId ?? lab?.categoryLegacyId ?? 0,
              categoryName: attempt.categoryName ?? lab?.categoryName ?? "",
              minutes: attempt.minutes ?? 0,
              highlights: attempt.highlights ?? [],
              pre: attempt.pre ?? null,
              post: attempt.post ?? null,
              signals: attempt.signals ?? {},
              attemptNo: attempt.attemptNo ?? index + 1,
            };
          });
        return { attempts, xp: state.xp ?? 0, badges: state.badges ?? [] };
      },
    },
  ),
);

/** Records a finished attempt and returns everything the debrief shows. Call from an event handler. */
export function finishAttempt(
  slug: LabSlug,
  scorecard: Scorecard,
  signals: BadgeSignals,
  pre: QuizResult | null,
  post: QuizResult | null,
  elapsedSeconds = 0,
): LabResult {
  const { newBadges, xp } = useLabsProgress.getState().record(slug, scorecard, signals, pre, post, elapsedSeconds);
  return { scorecard, xp, newBadges, pre, post };
}

export function bestScore(attempts: readonly Attempt[], slug: LabSlug): number | null {
  const scores = attempts.filter((a) => a.slug === slug).map((a) => a.overall);
  return scores.length ? Math.max(...scores) : null;
}

/** Average of the best attempt per lab, per skill axis (null when no lab touched it yet). */
export function skillProfile(attempts: readonly Attempt[]): Record<Skill, number | null> {
  const best = new Map<LabSlug, Attempt>();
  for (const attempt of attempts) {
    const current = best.get(attempt.slug);
    if (!current || attempt.overall > current.overall) best.set(attempt.slug, attempt);
  }
  const sums = new Map<Skill, { total: number; count: number }>();
  for (const attempt of best.values()) {
    for (const d of attempt.dimensions) {
      const entry = sums.get(d.skill) ?? { total: 0, count: 0 };
      sums.set(d.skill, { total: entry.total + d.score, count: entry.count + 1 });
    }
  }
  const skills = Object.keys(skillLabels) as Skill[];
  return Object.fromEntries(
    skills.map((skill) => {
      const entry = sums.get(skill);
      return [skill, entry ? Math.round(entry.total / entry.count) : null];
    }),
  ) as Record<Skill, number | null>;
}

// ---------- hydration (localStorage is browser-only; render server markup first) ----------

const subscribeHydration = (onChange: () => void) => useLabsProgress.persist.onFinishHydration(onChange);
const readHydrated = () => useLabsProgress.persist.hasHydrated();
const notHydrated = () => false;

export function useLabsHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, readHydrated, notHydrated);
}
