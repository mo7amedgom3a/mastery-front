"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Holds the last removed thing for a few seconds so it can be put back. One at a time: removing
 * another item replaces the offer.
 */
export function useUndo<T>(timeoutMs = 8000) {
  const [pending, setPending] = useState<T | null>(null);

  useEffect(() => {
    if (pending === null) return;
    const timer = setTimeout(() => setPending(null), timeoutMs);
    return () => clearTimeout(timer);
  }, [pending, timeoutMs]);

  const clear = useCallback(() => setPending(null), []);
  return { pending, offer: setPending, clear };
}
