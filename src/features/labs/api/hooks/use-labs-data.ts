"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLabsHydrated, useLabsProgress, type Attempt } from "../../model/progress-store";
import type { BadgeId } from "../../model/types";
import type { LabAttempt } from "../contract";
import { attemptKeys, attemptQueries, resetLabAttempts, seedDemoAttempts } from "../services/attempts";

export type LabsSnapshot = {
  attempts: Attempt[];
  xp: number;
  badges: BadgeId[];
  completed: number;
  hydrated: boolean;
  pending: boolean;
  error: boolean;
};

/**
 * Live attempts of a multi-scenario lab (`deal-recovery`, scenario `medical`) map back to the
 * storefront runner slug (`deal-recovery-medical`) that progress, badges and the hub key on.
 */
export function runnerSlugFor(slug: string, scenarioKey?: string): string {
  if (slug === "deal-recovery" && scenarioKey) return `deal-recovery-${scenarioKey}`;
  return slug;
}

export function toAttempt(attempt: LabAttempt): Attempt {
  return {
    id: attempt.attempt_id,
    slug: runnerSlugFor(attempt.slug, attempt.scenario_key) as Attempt["slug"],
    at: attempt.at,
    overall: attempt.overall,
    readiness: attempt.readiness,
    dimensions: attempt.dimensions,
    xp: attempt.xp,
    badges: attempt.badges,
    categoryLegacyId: attempt.category_legacy_id,
    categoryName: attempt.category_name,
    minutes: attempt.minutes,
    highlights: attempt.highlights,
    pre: attempt.pre,
    post: attempt.post,
    signals: attempt.signals,
    attemptNo: attempt.attempt_no,
  };
}

/**
 * The learner's lab history. The mock/live API is the source of truth; the old local store is a
 * fallback while the query loads, and for users who have not migrated yet.
 */
export function useLabsSnapshot(): LabsSnapshot {
  const query = useQuery(attemptQueries.list());
  const localHydrated = useLabsHydrated();
  const localAttempts = useLabsProgress((state) => state.attempts);
  const localXp = useLabsProgress((state) => state.xp);
  const localBadges = useLabsProgress((state) => state.badges);

  const serverAttempts = query.data?.items.map(toAttempt);
  // An empty server list after a reset is authoritative; an empty list before migration falls back
  // to the local store so a learner never loses sight of old attempts.
  const useServer = Boolean(serverAttempts?.length) || (query.isSuccess && localAttempts.length === 0);
  const attempts = useServer ? (serverAttempts ?? []) : localAttempts;
  const xp = useServer ? attempts.reduce((sum, attempt) => sum + attempt.xp, 0) : localXp;
  const badges = useServer ? [...new Set(attempts.flatMap((attempt) => attempt.badges))] : localBadges;

  return {
    attempts,
    xp,
    badges,
    completed: new Set(attempts.map((attempt) => attempt.slug)).size,
    hydrated: Boolean(serverAttempts) || localHydrated,
    pending: query.isPending && !localHydrated,
    error: query.isError && !localHydrated,
  };
}

export function useResetLabs() {
  const queryClient = useQueryClient();
  const resetLocal = useLabsProgress((state) => state.reset);
  return useMutation({
    mutationFn: resetLabAttempts,
    onSuccess: () => {
      resetLocal();
      void queryClient.invalidateQueries({ queryKey: attemptKeys.all });
    },
  });
}

export function useSeedDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDemoAttempts,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attemptKeys.all });
    },
  });
}
