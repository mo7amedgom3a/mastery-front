"use client";

import { useEffect, useState } from "react";

/**
 * A value that only changes after `delayMs` of quiet. Used by the search box so a request
 * starts on the typing pause, not on every keystroke; the pending value is still returned
 * immediately by the caller's own state, so the input never lags.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
