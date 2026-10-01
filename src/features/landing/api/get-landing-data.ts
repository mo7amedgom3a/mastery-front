import "server-only";

import { cache } from "react";

import {
  getLegacyCategoryCourses,
  getLegacyConsultations,
  getLegacyDiplomas,
  getLegacyLandingPage,
  getLegacyPackages,
  type LandingPageResponse,
} from "@/lib/api/legacy";
import { getNewestLiveTraining } from "@/features/live-training/api/get-live-trainings";
import { getInstructorNames } from "@/lib/api/instructor-names";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { searchProducts } from "@/lib/api/search";
import { cachedRead as cachedReadOptions, valueOf } from "@/lib/api/server-cache";

import { type CategoryCourses, type CourseDto, MAX_CARDS, mapLandingData, toSearchIndex } from "../model/mappers";
import type { LandingData } from "../model/types";

/** Cache tag for on-demand refresh (see app/api/revalidate). Keep in sync with page `revalidate`. */
export const LANDING_CACHE_TAG = "landing";
const LANDING_REVALIDATE_SECONDS = 300;
/** API maximum page size for legacy lists. Active diplomas and packages number in the tens. */
const PAGE_SIZE = 200;
/** API maximum page size for search. Diplomas and packages number in the tens. */
const SEARCH_PAGE_SIZE = 100;

const cachedRead = cachedReadOptions(LANDING_REVALIDATE_SECONDS, [LANDING_CACHE_TAG]);

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

/**
 * Everything the landing page needs, in parallel requests (category rails follow the landing page,
 * which lists the categories). Each request fails independently: the page always renders, and
 * sections or filters without data simply don't appear.
 */
export const getLandingData = cache(async (): Promise<LandingData> => {
  const landingRequest = getLegacyLandingPage(cachedRead);
  const [
    landing,
    categoryCourses,
    diplomas,
    packages,
    consultations,
    diplomaSearch,
    packageSearch,
    instructors,
    liveTraining,
  ] = await Promise.allSettled([
    landingRequest,
    landingRequest.catch(() => null).then(getCategoryCourses),
    getLegacyDiplomas({ active: true, limit: PAGE_SIZE }, cachedRead),
    getLegacyPackages({ limit: PAGE_SIZE }, cachedRead),
    getLegacyConsultations({ limit: PAGE_SIZE }, cachedRead),
    searchProducts({ product_type: ["diploma"], limit: SEARCH_PAGE_SIZE }, cachedRead),
    searchProducts({ product_type: ["package"], limit: SEARCH_PAGE_SIZE }, cachedRead),
    getInstructorNames(cachedRead),
    getNewestLiveTraining(),
  ]);

  const landingPage = valueOf(landing, "landing-page");
  const categoryPages = valueOf(categoryCourses, "category courses") ?? [];
  const activeDiplomas = valueOf(diplomas, "active diplomas");

  // Fill in prices the API's `current_price` misses, once per course across every list.
  const priced = new Map(
    (
      await withResolvedPrices(
        [
          ...(landingPage?.courses.items ?? []),
          ...(landingPage?.diplomas.items ?? []),
          ...categoryPages.flatMap((page) => page.items),
          ...(activeDiplomas?.items ?? []),
        ],
        cachedRead,
      )
    ).map((dto) => [dto.id, dto]),
  );
  const reprice = (items: CourseDto[]): CourseDto[] => items.map((dto) => priced.get(dto.id) ?? dto);

  return mapLandingData({
    landing: landingPage && {
      ...landingPage,
      courses: { ...landingPage.courses, items: reprice(landingPage.courses.items) },
      diplomas: { ...landingPage.diplomas, items: reprice(landingPage.diplomas.items) },
    },
    categoryCourses: categoryPages.map((page) => ({ ...page, items: reprice(page.items) })),
    activeDiplomas: activeDiplomas && { ...activeDiplomas, items: reprice(activeDiplomas.items) },
    packages: valueOf(packages, "packages"),
    consultations: valueOf(consultations, "consultations"),
    diplomaIndex: toSearchIndex("diploma", valueOf(diplomaSearch, "diploma search")),
    packageIndex: toSearchIndex("package", valueOf(packageSearch, "package search")),
    instructors: valueOf(instructors, "instructor names") ?? new Map(),
    liveTraining: valueOf(liveTraining, "live trainings"),
  });
});
