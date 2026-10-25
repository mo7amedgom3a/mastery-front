"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PlatformAnswers } from "@/features/marketers/components/platform-links";

export type YesNo = "yes" | "no";

export type ApplyAnswers = {
  fullName: string;
  email: string;
  phone: string;
  /** Arabic country name (sent as `country`) and its ISO alpha-2 code. */
  country: string;
  countryCode: string;
  city: string;
  address: string;
  poBox: string;
  postalCode: string;
  platforms: PlatformAnswers;
  hasEmailList: YesNo;
  isInfluencer: YesNo;
  audienceSize: string;
  marketingPlan: string;
};

export type ApplyField = keyof ApplyAnswers | "links" | "acceptTerms";
export type ApplyErrors = Partial<Record<ApplyField, string>> & { linkErrors?: Partial<Record<string, string>> };

type ApplyState = ApplyAnswers & {
  /** +1 after "next", -1 after "back": which side the next step slides in from. */
  direction: 1 | -1;
  errors: ApplyErrors;
  update: (patch: Partial<ApplyAnswers>) => void;
  setDirection: (direction: 1 | -1) => void;
  setErrors: (errors: ApplyErrors) => void;
  reset: () => void;
};

const EMPTY: ApplyAnswers = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  countryCode: "",
  city: "",
  address: "",
  poBox: "",
  postalCode: "",
  platforms: {},
  hasEmailList: "no",
  isInfluencer: "no",
  audienceSize: "",
  marketingPlan: "",
};

export function answersOf(state: ApplyAnswers): ApplyAnswers {
  const answers = {} as Record<keyof ApplyAnswers, unknown>;
  for (const key of Object.keys(EMPTY) as (keyof ApplyAnswers)[]) answers[key] = state[key];
  return answers as ApplyAnswers;
}

/**
 * Answers while the applicant moves between the steps. Kept in sessionStorage so a refresh or "back"
 * keeps them; nothing is sent until the last step. Reading and accepting the policy is not kept: it is
 * given on the last step, for the policy shown there.
 */
export const useApplyStore = create<ApplyState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      direction: 1,
      errors: {},
      // Editing a field clears its error.
      update: (patch) => {
        const errors = { ...get().errors };
        for (const key of Object.keys(patch) as (keyof ApplyAnswers)[]) delete errors[key];
        if ("platforms" in patch) delete errors.linkErrors;
        set({ ...patch, errors });
      },
      setDirection: (direction) => set({ direction }),
      setErrors: (errors) => set({ errors }),
      reset: () => set({ ...EMPTY, direction: 1, errors: {} }),
    }),
    {
      name: "mastery-marketer-application",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => answersOf(state),
      // Rehydrated on mount (see `useApplyHydrated`), so server and first client render agree.
      skipHydration: true,
    },
  ),
);

const subscribe = (onChange: () => void) => useApplyStore.persist.onFinishHydration(onChange);
const readHydrated = () => useApplyStore.persist.hasHydrated();
const notHydrated = () => false;

/** Loads saved answers and reports when they are in, so steps don't flash empty. */
export function useApplyHydrated(): boolean {
  useEffect(() => {
    if (!useApplyStore.persist.hasHydrated()) void useApplyStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(subscribe, readHydrated, notHydrated);
}
