import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";

/** Per-product cache tag, e.g. `course-4`, `package-1`; `POST /api/revalidate?tag=…` refreshes one product page. */
export function productCacheTag(kind: string, id: number): string {
  return `${kind}-${id}`;
}

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

/**
 * Options for an uncached server read, used by the admin Studio's live preview (`?preview=1`) so a
 * change made in the admin shows up on the storefront-backed preview without waiting for ISR.
 */
export function freshRead(tags: string[]): ApiRequestOptions {
  return {
    next: { revalidate: 0, tags: [CATALOG_CACHE_TAG, ...tags] },
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
