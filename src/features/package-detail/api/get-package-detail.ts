import "server-only";

import { cache } from "react";

import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { productCacheTag } from "@/features/product-detail/api/get-product-detail";
import { MAX_RAIL_CARDS } from "@/features/product-detail/model/mappers";
import type { CatalogIndex } from "@/features/product-detail/model/types";
import { ApiError } from "@/lib/api/client";
import { getInstructorNames } from "@/lib/api/instructor-names";
import {
  getLegacyCourse,
  getLegacyPackage,
  getLegacyRelatedResources,
  getLegacyResourceRecommendations,
} from "@/lib/api/legacy";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { mapPackageDetailData, type IncludedSource } from "../model/mappers";
import type { PackageDetailData } from "../model/types";

/** Keep in sync with the package page's `revalidate`. */
const PACKAGE_REVALIDATE_SECONDS = 300;

/**
 * The package with this legacy id, the courses and diplomas inside it, and its related and
 * recommended rails; null when it doesn't exist.
 *
 * Each included item is read from `/legacy/courses/{id}` (the same cached request its own page
 * makes), which carries its trainers, units and full price list. An item whose detail fails falls
 * back to its catalog card; the rails fail independently and are simply left off. A failed package
 * request throws, so ISR keeps serving the last good page.
 */
export const getPackageDetail = cache(async (id: number): Promise<PackageDetailData | null> => {
  const options = cachedRead(PACKAGE_REVALIDATE_SECONDS, [productCacheTag("package", id)]);
  let detail;
  try {
    detail = await getLegacyPackage(id, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }

  const path = { resource_type: "package", legacy_id: id };
  // Ask for a few extra: cards without artwork, duplicates and the included items are dropped.
  const limit = MAX_RAIL_CARDS + detail.course_ids.length + 4;
  const [included, related, recommendations, catalog, instructors] = await Promise.allSettled([
    Promise.allSettled(
      detail.course_ids.map((courseId) =>
        getLegacyCourse(
          courseId,
          // Courses and diplomas share one id space: tag both, like the course page does.
          cachedRead(PACKAGE_REVALIDATE_SECONDS, [productCacheTag("course", courseId), productCacheTag("diploma", courseId)]),
        ),
      ),
    ),
    getLegacyRelatedResources(path, { limit: Math.min(limit, 50) }, options).then(async (page) => ({
      ...page,
      courses: await withResolvedPrices(page.courses ?? [], options),
      diplomas: await withResolvedPrices(page.diplomas ?? [], options),
    })),
    getLegacyResourceRecommendations(path, { limit: Math.min(limit, 50) }, options),
    getCatalogIndex(),
    // Shared across every product page, like the catalog index.
    getInstructorNames(cachedRead(PACKAGE_REVALIDATE_SECONDS, ["catalog-index"])),
  ]);

  const catalogIndex = valueOf(catalog, "catalog index");
  const details = valueOf(included, `package ${id} items`) ?? [];
  const sources = detail.course_ids.map((courseId, index): IncludedSource | null => {
    const result = details[index];
    const itemDetail = result ? valueOf(result, `package ${id} item ${courseId}`) : null;
    return itemDetail ? { detail: itemDetail } : catalogCard(catalogIndex, courseId);
  });

  return mapPackageDetailData({
    detail,
    included: sources,
    related: valueOf(related, `package ${id} related`),
    recommendations: valueOf(recommendations, `package ${id} recommendations`),
    catalog: catalogIndex,
    instructors: valueOf(instructors, "instructor names"),
  });
});

function catalogCard(catalog: CatalogIndex | null, courseId: number): IncludedSource | null {
  const card = catalog?.courses.get(`course:${courseId}`) ?? catalog?.courses.get(`diploma:${courseId}`);
  return card ? { card } : null;
}
