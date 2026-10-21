import "server-only";

import { cache } from "react";

import { getCatalogExperts } from "@/lib/api/browse";
import { cachedRead } from "@/lib/api/server-cache";

import { mapExpertCard, type ExpertCardVM } from "../model";

/** Keep in sync with the `/experts` page's `revalidate`. */
export const EXPERTS_REVALIDATE_SECONDS = 600;
/** `POST /api/revalidate?tag=experts` refreshes the directory and the landing line-up; the admin sends it on every expert edit. */
export const EXPERTS_CACHE_TAG = "experts";

/** Every active expert with something published (the API lists at most 500; there are a few hundred). */
export const getExpertCards = cache(async (): Promise<ExpertCardVM[]> => {
  const experts = await getCatalogExperts({ limit: 500 }, cachedRead(EXPERTS_REVALIDATE_SECONDS, [EXPERTS_CACHE_TAG]));
  return experts
    .map(mapExpertCard)
    .filter((expert) => expert.name)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
        b.itemCount - a.itemCount ||
        a.name.localeCompare(b.name, "ar"),
    );
});
