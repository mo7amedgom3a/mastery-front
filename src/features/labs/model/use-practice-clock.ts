"use client";

import { useEffect, useRef } from "react";

/**
 * Wall-clock time spent in one attempt, reported when the debrief is recorded. The lab shell
 * already shows a live timer; this only answers "how many minutes did this attempt take?".
 * The clock starts after mount (never during render) and restarts with the lab's retry action.
 */
export function usePracticeClock(): { elapsedSeconds: () => number; reset: () => void } {
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return {
    elapsedSeconds: () => {
      const now = Date.now();
      if (startedAt.current == null) startedAt.current = now;
      return Math.max(0, Math.round((now - startedAt.current) / 1000));
    },
    reset: () => {
      startedAt.current = Date.now();
    },
  };
}
