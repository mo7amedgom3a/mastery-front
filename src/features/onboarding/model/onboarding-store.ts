"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OnboardingAnswers = {
  goal: string;
  /** Slug of the root skill (domain) the goal is about, e.g. `marketing`. */
  domain: string | null;
  /** Skills to build: the customer's skill gaps. Drive recommendations. */
  targetSkillIds: string[];
  /** Skills the customer already has. */
  currentSkillIds: string[];
  level: string | null;
  dailyMinutes: number | null;
  tags: string[];
  productTypes: string[];
};

type OnboardingState = OnboardingAnswers & {
  /** +1 after "next", -1 after "back": which side the next step slides in from. */
  direction: 1 | -1;
  update: (patch: Partial<OnboardingAnswers>) => void;
  setDirection: (direction: 1 | -1) => void;
  reset: () => void;
};

const EMPTY: OnboardingAnswers = {
  goal: "",
  domain: null,
  targetSkillIds: [],
  currentSkillIds: [],
  level: null,
  dailyMinutes: null,
  tags: [],
  productTypes: [],
};

/**
 * Answers while the customer moves between the onboarding steps. Kept in sessionStorage so a
 * refresh or "back" keeps them; nothing is sent until the last step.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...EMPTY,
      direction: 1,
      update: (patch) => set(patch),
      setDirection: (direction) => set({ direction }),
      reset: () => set({ ...EMPTY, direction: 1 }),
    }),
    {
      name: "mastery-onboarding",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): OnboardingAnswers => ({
        goal: state.goal,
        domain: state.domain,
        targetSkillIds: state.targetSkillIds,
        currentSkillIds: state.currentSkillIds,
        level: state.level,
        dailyMinutes: state.dailyMinutes,
        tags: state.tags,
        productTypes: state.productTypes,
      }),
      // Rehydrated on mount (see `useOnboardingHydrated`), so server and first client render agree.
      skipHydration: true,
    },
  ),
);

/** Toggles `id` in a list of ids. */
export function toggleId(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

const subscribe = (onChange: () => void) => useOnboardingStore.persist.onFinishHydration(onChange);
const readHydrated = () => useOnboardingStore.persist.hasHydrated();
const notHydrated = () => false;

/** Loads saved answers and reports when they are in, so steps don't flash empty. */
export function useOnboardingHydrated(): boolean {
  useEffect(() => {
    if (!useOnboardingStore.persist.hasHydrated()) void useOnboardingStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(subscribe, readHydrated, notHydrated);
}
