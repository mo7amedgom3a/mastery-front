import "server-only";

import { cache } from "react";

import { listActiveAnnouncements, type AnnouncementBar } from "@/lib/api/announcements";
import { cachedRead } from "@/lib/api/server-cache";

/** `POST /api/revalidate?tag=announcements` shows an admin change at once. */
export const ANNOUNCEMENTS_CACHE_TAG = "announcements";

/**
 * Short revalidate: a bar follows its schedule and coupon state (expired or used-up coupons drop out),
 * so a minute is the most a visitor can see a stale bar. The API caches the body too.
 */
const ANNOUNCEMENTS_REVALIDATE_SECONDS = 60;
const read = cachedRead(ANNOUNCEMENTS_REVALIDATE_SECONDS, [ANNOUNCEMENTS_CACHE_TAG]);

/**
 * The live announcement bars, read once per request in the root layout. A failed read (API down,
 * including at build time) returns no bars, so the header always renders.
 */
export const getAnnouncements = cache(async (): Promise<AnnouncementBar[]> => {
  try {
    return (await listActiveAnnouncements(read)).bars;
  } catch (error) {
    console.error("[announcements] request failed", error);
    return [];
  }
});
