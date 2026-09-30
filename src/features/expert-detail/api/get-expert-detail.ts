import "server-only";

import { cache } from "react";

import { getConsultationIndex } from "@/features/consultation-detail/api/get-consultation-index";
import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { MAX_RAIL_CARDS } from "@/features/product-detail/model/mappers";
import { ApiError } from "@/lib/api/client";
import { getInstructorNames } from "@/lib/api/instructor-names";
import { getLegacyExpert, getLegacyExpertRecommendations } from "@/lib/api/legacy";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { mapExpertDetailData } from "../model/mappers";
import type { ExpertDetailData } from "../model/types";

/** Keep in sync with the expert page's `revalidate`. */
const EXPERT_REVALIDATE_SECONDS = 300;

/** Per-expert cache tag, e.g. `expert-9`; `POST /api/revalidate?tag=expert-9` refreshes one profile. */
export function expertCacheTag(key: string): string {
  return `expert-${key}`;
}

/**
 * The expert with this key (a trainer, a consultant, or both under one profile), everything they
 * offer, and the rails under it; null when there is no such expert.
 *
 * Who counts as the same person, what they offer and the "what they do" points all come from the
 * API in one response. Recommendations fail independently and are simply left off the page. A
 * failed expert request throws, so ISR keeps serving the last good page.
 */
export const getExpertDetail = cache(async (key: string): Promise<ExpertDetailData | null> => {
  const options = cachedRead(EXPERT_REVALIDATE_SECONDS, [expertCacheTag(key)]);
  let detail;
  try {
    detail = await getLegacyExpert(key, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }

  // Ask for a few extra: cards without artwork and the expert's own items are dropped.
  const limit = MAX_RAIL_CARDS + 8;
  const priced = (items: typeof detail.courses | undefined) => withResolvedPrices(items ?? [], options);
  const [courses, diplomas, relatedCourses, relatedDiplomas, recommendations, catalog, consultations, instructors] =
    await Promise.allSettled([
      priced(detail.courses),
      priced(detail.diplomas),
      priced(detail.related.courses),
      priced(detail.related.diplomas),
      getLegacyExpertRecommendations(key, { limit }, options),
      getCatalogIndex(),
      getConsultationIndex(),
      // Shared across every product page, like the catalog index.
      getInstructorNames(cachedRead(EXPERT_REVALIDATE_SECONDS, ["catalog-index"])),
    ]);

  return mapExpertDetailData({
    detail: {
      ...detail,
      courses: valueOf(courses, `expert ${key} course prices`) ?? detail.courses,
      diplomas: valueOf(diplomas, `expert ${key} diploma prices`) ?? detail.diplomas,
      related: {
        ...detail.related,
        courses: valueOf(relatedCourses, `expert ${key} related course prices`) ?? detail.related.courses,
        diplomas: valueOf(relatedDiplomas, `expert ${key} related diploma prices`) ?? detail.related.diplomas,
      },
    },
    recommendations: valueOf(recommendations, `expert ${key} recommendations`),
    catalog: valueOf(catalog, "catalog index"),
    consultations: valueOf(consultations, "consultation index"),
    instructors: valueOf(instructors, "instructor names"),
  });
});
