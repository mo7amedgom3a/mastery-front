"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Department, Industry, Platform, TrainingGoal, TrainingType } from "./options";

export type RequestAnswers = {
  companyName: string;
  industry: Industry | null;
  /** The company's own industry when `industry` is "other". */
  industryOther: string;
  companyRange: string | null;
  websiteUrl: string;
  /** ISO alpha-2 code and the Arabic name shown (and sent) for it. */
  countryCode: string | null;
  countryName: string;
  city: string;
  teamSize: string;
  trainingTypes: TrainingType[];
  trainingGoals: TrainingGoal[];
  departments: Department[];
  otherDepartment: string;
  hasTrainingBudget: boolean | null;
  usedPlatformBefore: boolean | null;
  previousPlatforms: Platform[];
  otherPlatform: string;
  categoryIds: string[];
  skillIds: string[];
  summary: string;
  contactName: string;
  jobTitle: string;
  companyEmail: string;
  contactPhone: string;
};

export type RequestField = keyof RequestAnswers;
export type RequestErrors = Partial<Record<RequestField, string>>;

type RequestState = RequestAnswers & {
  /** +1 after "next", -1 after "back": which side the next step slides in from. */
  direction: 1 | -1;
  /** Errors on screen: set by "next" on an incomplete step, or by the server after submit. */
  errors: RequestErrors;
  update: (patch: Partial<RequestAnswers>) => void;
  setDirection: (direction: 1 | -1) => void;
  setErrors: (errors: RequestErrors) => void;
  reset: () => void;
};

const EMPTY: RequestAnswers = {
  companyName: "",
  industry: null,
  industryOther: "",
  companyRange: null,
  websiteUrl: "",
  countryCode: null,
  countryName: "",
  city: "",
  teamSize: "",
  trainingTypes: [],
  trainingGoals: [],
  departments: [],
  otherDepartment: "",
  hasTrainingBudget: null,
  usedPlatformBefore: null,
  previousPlatforms: [],
  otherPlatform: "",
  categoryIds: [],
  skillIds: [],
  summary: "",
  contactName: "",
  jobTitle: "",
  companyEmail: "",
  contactPhone: "",
};

/** Just the answers (no actions or UI state): what is saved and what is sent. */
export function answersOf(state: RequestAnswers): RequestAnswers {
  const answers = {} as Record<RequestField, unknown>;
  for (const key of Object.keys(EMPTY) as RequestField[]) answers[key] = state[key];
  return answers as RequestAnswers;
}

/**
 * Answers while the company moves between the request steps. Kept in sessionStorage so a refresh or
 * "back" keeps them; nothing is sent until the last step.
 */
export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      direction: 1,
      errors: {},
      // Editing a field clears its error.
      update: (patch) => {
        const errors = { ...get().errors };
        for (const key of Object.keys(patch) as RequestField[]) delete errors[key];
        set({ ...patch, errors });
      },
      setDirection: (direction) => set({ direction }),
      setErrors: (errors) => set({ errors }),
      reset: () => set({ ...EMPTY, direction: 1, errors: {} }),
    }),
    {
      name: "mastery-b2b-request",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): RequestAnswers => answersOf(state),
      // Rehydrated on mount (see `useRequestHydrated`), so server and first client render agree.
      skipHydration: true,
    },
  ),
);

/** Toggles `value` in a list of choices. */
export function toggleValue<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const subscribe = (onChange: () => void) => useRequestStore.persist.onFinishHydration(onChange);
const readHydrated = () => useRequestStore.persist.hasHydrated();
const notHydrated = () => false;

/** Loads saved answers and reports when they are in, so steps don't flash empty. */
export function useRequestHydrated(): boolean {
  useEffect(() => {
    if (!useRequestStore.persist.hasHydrated()) void useRequestStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(subscribe, readHydrated, notHydrated);
}
