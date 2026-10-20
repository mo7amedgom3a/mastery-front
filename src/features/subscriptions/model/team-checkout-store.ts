"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TeamAnswers = {
  /** The plan these answers belong to; another plan starts fresh. */
  planSlug: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  jobTitle: string;
  seats: number;
  /** The lead saved when the details step was completed; checkout links its order to it. */
  leadId: string | null;
};

export type TeamField = Exclude<keyof TeamAnswers, "planSlug" | "leadId">;
export type TeamErrors = Partial<Record<TeamField, string>>;

type TeamState = TeamAnswers & {
  /** +1 after "next", -1 after "back": which side the next step slides in from. */
  direction: 1 | -1;
  errors: TeamErrors;
  update: (patch: Partial<TeamAnswers>) => void;
  /** Starts (or keeps) the answers for `planSlug`, with the plan's team size when starting fresh. */
  start: (planSlug: string, seats: number) => void;
  setDirection: (direction: 1 | -1) => void;
  setErrors: (errors: TeamErrors) => void;
  reset: () => void;
};

const EMPTY: TeamAnswers = { planSlug: "", companyName: "", contactName: "", email: "", phone: "", jobTitle: "", seats: 0, leadId: null };

/**
 * The company's answers while it moves from the plan page through details and review to Stripe. Kept in
 * sessionStorage so "back" from Stripe or a refresh keeps them; cleared once the subscription is paid.
 */
export const useTeamCheckoutStore = create<TeamState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      direction: 1,
      errors: {},
      update: (patch) => {
        const errors = { ...get().errors };
        for (const key of Object.keys(patch) as TeamField[]) delete errors[key];
        set({ ...patch, errors });
      },
      start: (planSlug, seats) => {
        if (get().planSlug === planSlug) return;
        set({ ...EMPTY, planSlug, seats, direction: 1, errors: {} });
      },
      setDirection: (direction) => set({ direction }),
      setErrors: (errors) => set({ errors }),
      reset: () => set({ ...EMPTY, direction: 1, errors: {} }),
    }),
    {
      name: "mastery-team-checkout",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): TeamAnswers => ({
        planSlug: state.planSlug,
        companyName: state.companyName,
        contactName: state.contactName,
        email: state.email,
        phone: state.phone,
        jobTitle: state.jobTitle,
        seats: state.seats,
        leadId: state.leadId,
      }),
      skipHydration: true,
    },
  ),
);

const subscribe = (onChange: () => void) => useTeamCheckoutStore.persist.onFinishHydration(onChange);
const readHydrated = () => useTeamCheckoutStore.persist.hasHydrated();
const notHydrated = () => false;

/** Loads the saved answers and reports when they are in, so the steps don't flash empty. */
export function useTeamCheckoutHydrated(): boolean {
  useEffect(() => {
    if (!useTeamCheckoutStore.persist.hasHydrated()) void useTeamCheckoutStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(subscribe, readHydrated, notHydrated);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What blocks moving on from the details step (company and contact only; the team size comes on review). */
export function detailsErrors(answers: TeamAnswers): TeamErrors {
  const errors: TeamErrors = {};
  if (!answers.companyName.trim()) errors.companyName = "اكتب اسم الشركة.";
  if (!answers.contactName.trim()) errors.contactName = "اكتب اسم المسؤول عن الاشتراك.";
  if (!EMAIL.test(answers.email.trim())) errors.email = "اكتب بريداً إلكترونياً صالحاً للعمل.";
  if (answers.phone.trim() && !/^\+?[\d\s-]{7,20}$/.test(answers.phone.trim())) errors.phone = "اكتب رقماً صالحاً، مثل ‎+971 50 123 4567.";
  return errors;
}
