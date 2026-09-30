import "server-only";

import { cache } from "react";

import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { productCacheTag } from "@/features/product-detail/api/get-product-detail";
import { MAX_RAIL_CARDS } from "@/features/product-detail/model/mappers";
import { expertCacheTag } from "@/features/expert-detail/api/get-expert-detail";
import { ApiError } from "@/lib/api/client";
import { getInstructorNames } from "@/lib/api/instructor-names";
import {
  getLegacyConsultation,
  getLegacyExpert,
  getLegacyRelatedResources,
  getLegacyResourceRecommendations,
} from "@/lib/api/legacy";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { mapConsultationDetailData } from "../model/mappers";
import type { ConsultationDetailData } from "../model/types";
import { getConsultationIndex } from "./get-consultation-index";
import { getConsultationAvailability } from "./mock-availability";

/** Keep in sync with the consultation page's `revalidate`. */
const CONSULTATION_REVALIDATE_SECONDS = 300;

/**
 * The consultation with this legacy id, its expert, and its two rails (other consultations, and
 * courses/diplomas/packages); null when it doesn't exist.
 *
 * The expert's photo, bio, other consultations and programs come from their profile, which the API
 * names on the consultation (`expert_key`). Everything but the consultation itself fails
 * independently and is simply left off the page. A failed consultation request throws, so ISR keeps serving the last good page.
 */
export const getConsultationDetail = cache(async (id: number): Promise<ConsultationDetailData | null> => {
  const options = cachedRead(CONSULTATION_REVALIDATE_SECONDS, [productCacheTag("consultation", id)]);
  let detail;
  try {
    detail = await getLegacyConsultation(id, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }

  const path = { resource_type: "consultation", legacy_id: id };
  // Ask for a few extra: cards without artwork, duplicates and the consultation itself are dropped.
  const limit = MAX_RAIL_CARDS + 4;
  const expertKey = detail.consultation.expert_key;
  const [expert, consultations, related, recommendations, catalog, instructors] = await Promise.allSettled([
    expertKey
      ? getLegacyExpert(
          expertKey,
          cachedRead(CONSULTATION_REVALIDATE_SECONDS, [productCacheTag("consultation", id), expertCacheTag(expertKey)]),
        ).then(async (profile) => ({
          ...profile,
          courses: await withResolvedPrices(profile.courses, options),
          diplomas: await withResolvedPrices(profile.diplomas, options),
        }))
      : null,
    getConsultationIndex(),
    getLegacyRelatedResources(path, { limit }, options).then(async (page) => ({
      ...page,
      courses: await withResolvedPrices(page.courses ?? [], options),
      diplomas: await withResolvedPrices(page.diplomas ?? [], options),
    })),
    getLegacyResourceRecommendations(path, { limit }, options),
    getCatalogIndex(),
    // Shared across every product page, like the catalog index.
    getInstructorNames(cachedRead(CONSULTATION_REVALIDATE_SECONDS, ["catalog-index"])),
  ]);

  return mapConsultationDetailData({
    detail,
    expert: valueOf(expert, `consultation ${id} expert`),
    availability: getConsultationAvailability(id, detail.consultation.session_duration),
    consultations: valueOf(consultations, "consultation index"),
    related: valueOf(related, `consultation ${id} related`),
    recommendations: valueOf(recommendations, `consultation ${id} recommendations`),
    catalog: valueOf(catalog, "catalog index"),
    instructors: valueOf(instructors, "instructor names"),
  });
});
