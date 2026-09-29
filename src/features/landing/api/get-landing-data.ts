import "server-only";

import { cache } from "react";

import type { ApiRequestOptions } from "@/lib/api/client";
import {
  getLegacyCategoryCourses,
  getLegacyDiplomas,
  getLegacyLandingPage,
  getLegacyPackages,
  type LandingPageResponse,
} from "@/lib/api/legacy";
import { searchProducts } from "@/lib/api/search";

import { type CategoryCourses, MAX_CARDS, mapLandingData, toSearchIndex } from "../model/mappers";
import type { LandingData } from "../model/types";

/** Cache tag for on-demand refresh (see app/api/revalidate). Keep in sync with page `revalidate`. */
export const LANDING_CACHE_TAG = "landing";
const LANDING_REVALIDATE_SECONDS = 300;
/** API maximum page size for legacy lists. Active diplomas and packages number in the tens. */
const PAGE_SIZE = 200;
/** API maximum page size for search. Diplomas and packages number in the tens. */
const SEARCH_PAGE_SIZE = 100;

const cachedRead: ApiRequestOptions = {
  next: { revalidate: LANDING_REVALIDATE_SECONDS, tags: [LANDING_CACHE_TAG] },
  // A random X-Request-ID would change the fetch cache key on every call and defeat ISR.
  context: { requestId: null },
};

/**
 * One rail's worth of courses per top-level category, so each category chip can fill its rail.
 * Membership comes from the category link table, which the course's own `category_id` often lacks.
 */
async function getCategoryCourses(landing: LandingPageResponse | null): Promise<CategoryCourses[]> {
  const categories = (landing?.categories ?? []).filter((category) => category.parent_id === null);
  const results = await Promise.allSettled(
    categories.map((category) => getLegacyCategoryCourses(category.id, { limit: MAX_CARDS }, cachedRead)),
  );
  return results.flatMap((result, index) => {
    const page = valueOf(result, `category ${categories[index].id} courses`);
    return page ? [{ categoryId: categories[index].id, items: page.items }] : [];
  });
}

function valueOf<T>(result: PromiseSettledResult<T>, label: string): T | null {
  if (result.status === "fulfilled") {
    return result.value;
  }
  console.error(`[landing] ${label} request failed`, result.reason);
  return null;
}

/**
 * Everything the landing page needs, in parallel requests (category rails follow the landing page,
 * which lists the categories). Each request fails independently: the page always renders, and
 * sections or filters without data simply don't appear.
 */
export const getLandingData = cache(async (): Promise<LandingData> => {
  const landingRequest = getLegacyLandingPage(cachedRead);
  const [landing, categoryCourses, diplomas, packages, diplomaSearch, packageSearch] = await Promise.allSettled([
    landingRequest,
    landingRequest.catch(() => null).then(getCategoryCourses),
    getLegacyDiplomas({ active: true, limit: PAGE_SIZE }, cachedRead),
    getLegacyPackages({ limit: PAGE_SIZE }, cachedRead),
    searchProducts({ product_type: ["diploma"], limit: SEARCH_PAGE_SIZE }, cachedRead),
    searchProducts({ product_type: ["package"], limit: SEARCH_PAGE_SIZE }, cachedRead),
  ]);

  return mapLandingData({
    landing: valueOf(landing, "landing-page"),
    categoryCourses: valueOf(categoryCourses, "category courses") ?? [],
    activeDiplomas: valueOf(diplomas, "active diplomas"),
    packages: valueOf(packages, "packages"),
    diplomaIndex: toSearchIndex("diploma", valueOf(diplomaSearch, "diploma search")),
    packageIndex: toSearchIndex("package", valueOf(packageSearch, "package search")),
  });
});
