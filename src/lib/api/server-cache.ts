import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";

/** Cache tag shared by every catalog read (landing and detail pages); see app/api/revalidate. */
export const CATALOG_CACHE_TAG = "catalog";

/**
 * Options for an ISR-cached server read. Tags let `/api/revalidate` refresh the data on demand.
 * A random X-Request-ID would change the fetch cache key on every call and defeat ISR, so none is sent.
 */
export function cachedRead(revalidate: number, tags: string[]): ApiRequestOptions {
  return {
    next: { revalidate, tags: [CATALOG_CACHE_TAG, ...tags] },
    context: { requestId: null },
  };
}

/** A settled request's value, or null (logged) when it failed, so one failure never breaks a page. */
export function valueOf<T>(result: PromiseSettledResult<T>, label: string): T | null {
  if (result.status === "fulfilled") {
    return result.value;
  }
  console.error(`[api] ${label} request failed`, result.reason);
  return null;
}
