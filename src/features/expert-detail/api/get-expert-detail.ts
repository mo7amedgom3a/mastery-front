import "server-only";

import { cache } from "react";

import { getConsultationIndex } from "@/features/consultation-detail/api/get-consultation-index";
import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { ApiError } from "@/lib/api/client";
import {
  cardToConsultationDto,
  cardToCourseDto,
  cardToPackageDto,
  getCatalogExpert,
  type CatalogCard,
  type CatalogExpertDetail,
} from "@/lib/api/browse";
import { getInstructorNames } from "@/lib/api/instructor-names";
import type { LegacyExpertResponse } from "@/lib/api/legacy";
import { cachedRead, freshRead, valueOf } from "@/lib/api/server-cache";

import { mapExpertDetailData, type ExpertDetailSources } from "../model/mappers";
import type { ExpertDetailData } from "../model/types";

/** Keep in sync with the expert page's `revalidate`. */
const EXPERT_REVALIDATE_SECONDS = 300;

/** Per-expert cache tag, e.g. `expert-9`; `POST /api/revalidate?tag=expert-9` refreshes one profile. */
export function expertCacheTag(key: string): string {
  return `expert-${key}`;
}

const isDto = <T,>(dto: T | null): dto is T => dto !== null;
const byType = (cards: readonly CatalogCard[], type: string) => cards.filter((card) => card.product_type === type);

/** The expert in the shape the mapper reads, built from the B2C expert profile and its item cards. */
export function toLegacyShape(detail: CatalogExpertDetail): LegacyExpertResponse {
  const { expert } = detail;
  const related = detail.related ?? [];
  return {
    expert: {
      key: expert.key,
      trainer_id: null,
      consultant_ids: [],
      name: expert.name,
      profile_image: expert.avatar ?? null,
      course_count: expert.course_count ?? 0,
      diploma_count: expert.diploma_count ?? 0,
      package_count: expert.package_count ?? 0,
      consultation_count: expert.consultation_count ?? 0,
      cover_image: expert.cover_image ?? null,
      info: expert.info ?? null,
      more_info: expert.more_info ?? null,
      specialized: expert.specialized ?? null,
      scoped_experience: expert.scoped_experience ?? null,
      languages: expert.languages ?? null,
      city: expert.city ?? null,
      educational_level: expert.educational_level ?? null,
      total_years_of_experience: expert.years_of_experience ?? null,
      facebook_url: expert.facebook_url ?? null,
      instagram_url: expert.instagram_url ?? null,
      youtube_url: expert.youtube_url ?? null,
    },
    categories: (detail.categories ?? []).map((name, index) => ({
      id: index + 1, name, parent_id: null, image: null, description: null, order: index,
    })),
    courses: (detail.courses ?? []).map(cardToCourseDto).filter(isDto),
    diplomas: (detail.diplomas ?? []).map(cardToCourseDto).filter(isDto),
    packages: (detail.packages ?? []).map(cardToPackageDto).filter(isDto),
    consultations: (detail.consultations ?? []).map(cardToConsultationDto).filter(isDto),
    highlights: {
      what_i_do: detail.highlights?.what_i_do ?? [],
      who_i_help: detail.highlights?.who_i_help ?? [],
      source: detail.highlights?.source ?? "extracted",
    },
    related: {
      courses: byType(related, "course").map(cardToCourseDto).filter(isDto),
      diplomas: byType(related, "diploma").map(cardToCourseDto).filter(isDto),
      packages: byType(related, "package").map(cardToPackageDto).filter(isDto),
      consultations: byType(related, "consultation").map(cardToConsultationDto).filter(isDto),
      instructors: [],
    },
  };
}

/**
 * The expert with this key (a trainer, a consultant, or both under one profile), everything they offer,
 * and the rails under it; null when there is no such expert. Read from B2C (`/catalog/experts/{key}`).
 * Rails fail independently and are simply left off the page; a failed expert request throws, so ISR
 * keeps serving the last good page. `fresh` skips the cache (the admin Studio preview).
 */
export const getExpertDetail = cache(async (key: string, fresh = false): Promise<ExpertDetailData | null> => {
  const options = fresh
    ? // The preview may show a hidden expert and the Studio draft: the API trusts the shared revalidate secret.
      { ...freshRead([expertCacheTag(key)]), headers: { "x-preview-secret": process.env.REVALIDATE_SECRET ?? "" } }
    : cachedRead(EXPERT_REVALIDATE_SECONDS, [expertCacheTag(key)]);
  let detail: CatalogExpertDetail;
  try {
    detail = await getCatalogExpert(key, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }

  const [catalog, consultations, instructors] = await Promise.allSettled([
    getCatalogIndex(),
    getConsultationIndex(),
    // Shared across every product page, like the catalog index.
    getInstructorNames(cachedRead(EXPERT_REVALIDATE_SECONDS, ["catalog-index"])),
  ]);

  const sources: ExpertDetailSources = {
    detail: toLegacyShape(detail),
    b2c: detail,
    recommendations: null,
    catalog: valueOf(catalog, "catalog index"),
    consultations: valueOf(consultations, "consultation index"),
    instructors: valueOf(instructors, "instructor names"),
  };
  return mapExpertDetailData(sources);
});
