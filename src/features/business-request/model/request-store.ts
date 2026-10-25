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
  otherTrainingGoal: string;
  departments: Department[];
  otherDepartment: string;
  hasTrainingBudget: boolean | "maybe" | null;
  hasInternalLms: boolean | null;
  usedPlatformBefore: boolean | null;
  previousPlatforms: Platform[];
  otherPlatform: string;
  categoryIds: string[];
  otherCategorySelected: boolean;
  otherCategory: string;
  skillIds: string[];
  otherSkillSelected: boolean;
  otherSkill: string;
  summary: string;
  contactName: string;
  jobTitle: string;
  companyEmail: string;
  contactPhone: string;
};

export type RequestField = keyof RequestAnswers;
export type RequestErrors = Partial<Record<RequestField, string>>;

type RequestState = RequestAnswers & {
  draftToken: string | null;
  draftSaveStatus: "idle" | "saving" | "saved" | "error";
  /** +1 after "next", -1 after "back": which side the next step slides in from. */
  direction: 1 | -1;
  /** Errors on screen: set by "next" on an incomplete step, or by the server after submit. */
  errors: RequestErrors;
  update: (patch: Partial<RequestAnswers>) => void;
  setDirection: (direction: 1 | -1) => void;
  setErrors: (errors: RequestErrors) => void;
  setDraftToken: (token: string) => void;
  setDraftSaveStatus: (status: RequestState["draftSaveStatus"]) => void;
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
  otherTrainingGoal: "",
  departments: [],
  otherDepartment: "",
  hasTrainingBudget: null,
  hasInternalLms: null,
  usedPlatformBefore: null,
  previousPlatforms: [],
  otherPlatform: "",
  categoryIds: [],
  otherCategorySelected: false,
  otherCategory: "",
  skillIds: [],
  otherSkillSelected: false,
  otherSkill: "",
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
      draftToken: null,
      draftSaveStatus: "idle",
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
      setDraftToken: (draftToken) => set({ draftToken }),
      setDraftSaveStatus: (draftSaveStatus) => set({ draftSaveStatus }),
      reset: () => set({ ...EMPTY, draftToken: null, draftSaveStatus: "idle", direction: 1, errors: {} }),
    }),
    {
      name: "mastery-b2b-request",
      version: 3,
      migrate: (persisted, version) => {
        const saved = persisted as Partial<RequestAnswers> & { previousPlatforms?: string[]; draftToken?: string | null };
        const oldPlatforms = Array.isArray(saved.previousPlatforms) ? saved.previousPlatforms : [];
        const allowed = new Set<string>(["coursera", "udemy", "linkedin_learning", "other"]);
        return {
          ...EMPTY,
          ...saved,
          // The old "No" label meant that the amount was decided by need.
          hasTrainingBudget: version < 2 && saved.hasTrainingBudget === false ? "maybe" : (saved.hasTrainingBudget ?? null),
          hasInternalLms: oldPlatforms.includes("internal_lms") ? true : (saved.hasInternalLms ?? null),
          previousPlatforms: oldPlatforms.filter((value): value is Platform => allowed.has(value)),
          draftToken: saved.draftToken ?? null,
        };
      },
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ ...answersOf(state), draftToken: state.draftToken }),
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
