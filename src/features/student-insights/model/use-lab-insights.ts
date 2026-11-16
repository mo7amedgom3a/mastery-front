"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { attemptQueries, toAttempt } from "@/features/labs/api";
import { useLabsHydrated, useLabsProgress, type Attempt } from "@/features/labs/model/progress-store";

import { buildLabInsights, filterAttemptsByRange, type LabInsights, type RangeKey } from "./lab-insights";

export type LabInsightsState = {
  /** localStorage is browser-only; panels show skeletons until it has been read. */
  hydrated: boolean;
  attempts: readonly Attempt[];
  /** Attempts recorded at any time, for the "nothing in this period" state. */
  hasAny: boolean;
  insight: LabInsights;
};

/** Reads the local lab attempts, applies the page's range filter and derives the report. */
export function useLabInsights(range: RangeKey): LabInsightsState {
  const query = useQuery(attemptQueries.list());
  const localHydrated = useLabsHydrated();
  const localAttempts = useLabsProgress((state) => state.attempts);
  const stored = useMemo<readonly Attempt[]>(() => {
    const server = query.data?.items.map(toAttempt);
    if (server?.length) return server;
    if (query.isSuccess && localAttempts.length === 0) return [];
    return localAttempts;
  }, [query.data, query.isSuccess, localAttempts]);
  const hydrated = Boolean(query.data) || localHydrated;
  const attempts = useMemo(() => (hydrated ? filterAttemptsByRange(stored, range) : []), [hydrated, stored, range]);
  const insight = useMemo(() => buildLabInsights(attempts), [attempts]);
  return { hydrated, attempts, hasAny: stored.length > 0, insight };
}
