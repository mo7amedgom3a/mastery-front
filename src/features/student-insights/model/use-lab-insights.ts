"use client";

import { useMemo } from "react";

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
  const hydrated = useLabsHydrated();
  const stored = useLabsProgress((s) => s.attempts);
  const attempts = useMemo(() => (hydrated ? filterAttemptsByRange(stored, range) : []), [hydrated, stored, range]);
  const insight = useMemo(() => buildLabInsights(attempts), [attempts]);
  return { hydrated, attempts, hasAny: stored.length > 0, insight };
}
