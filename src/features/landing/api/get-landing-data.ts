import "server-only";

import { cache } from "react";

import { getCatalogBundle } from "@/features/bundle-detail/api/get-bundle-detail";
import { mapBundleLanding } from "@/features/bundle-detail/model/mappers";
import type { BundleLandingVM } from "@/features/bundle-detail/model/types";
import { getCatalogProducts, type CatalogBundleDetail } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { getFeaturedLiveTrainings } from "@/features/live-training/api/get-live-trainings";
import {
  cardToConsultationDto,
  cardToCourseDto,
  cardToPackageDto,
  getAllCatalogCards,
  getCatalogCards,
  getCatalogLanding,
  type CatalogLanding,
} from "@/lib/api/browse";
import { getInstructorNames } from "@/lib/api/instructor-names";
import type { LandingPageResponse } from "@/lib/api/legacy";
import { getProductContent } from "@/lib/api/product-content";
import { searchProducts } from "@/lib/api/search";
import { cachedRead as cachedReadOptions, valueOf } from "@/lib/api/server-cache";

import { type CategoryCourses, MAX_CARDS, mapLandingData, toSearchIndex } from "../model/mappers";
import type { LandingData } from "../model/types";

/** Cache tag for on-demand refresh (see app/api/revalidate). Keep in sync with page `revalidate`. */
export const LANDING_CACHE_TAG = "landing";
const LANDING_REVALIDATE_SECONDS = 300;
/** API maximum page size for search. Diplomas and packages number in the tens. */
const SEARCH_PAGE_SIZE = 100;

const cachedRead = cachedReadOptions(LANDING_REVALIDATE_SECONDS, [LANDING_CACHE_TAG]);

const isDto = <T,>(dto: T | null): dto is T => dto !== null;

type Landing = {
  faqs: NonNullable<CatalogLanding["faqs"]>;
  categories: (Omit<NonNullable<CatalogLanding["categories"]>[number], "courses"> & {
    courses: NonNullable<NonNullable<CatalogLanding["categories"]>[number]["courses"]>;
  })[];
  stats: NonNullable<CatalogLanding["stats"]>;
};

/** Fills the fields the API omits when empty. */
function normalise(landing: CatalogLanding): Landing {
  return {
    faqs: landing.faqs ?? [],
    categories: (landing.categories ?? []).map((category) => ({ ...category, courses: category.courses ?? [] })),
    stats: landing.stats ?? { courses: 0, diplomas: 0, packages: 0, instructors: 0 },
  };
}

/**
 * The landing aggregate the mappers read, built from B2C: `/catalog/landing` (banner, FAQs, category
 * rails, counters) and the card lists. Category ids are the legacy ids the storefront URLs use.
 */
function toLandingPage(
  landing: Landing,
  featured: Awaited<ReturnType<typeof getCatalogCards>>,
  diplomas: LandingPageResponse["diplomas"]["items"],
  packages: LandingPageResponse["packages"]["items"],
  consultations: LandingPageResponse["consultations"]["items"],
): LandingPageResponse {
  const page = <T,>(items: T[], total = items.length) => ({ items, total, limit: items.length, offset: 0 });
  return {
    banners: [],
    categories: landing.categories.flatMap((category, index) =>
      category.legacy_category_id === null || category.legacy_category_id === undefined
        ? []
        : [{ id: category.legacy_category_id, name: category.name, parent_id: null, order: index } as LandingPageResponse["categories"][number]],
    ),
    courses: page(featured.items.map(cardToCourseDto).filter(isDto), landing.stats.courses),
    diplomas: page(diplomas),
    packages: page(packages),
    consultations: page(consultations),
    faqs: landing.faqs.map((faq, index) => ({ id: index + 1, section_id: null, question: faq.question, answer: faq.answer, link: null })),
    insights: {
      visitor_count: null, visitor_count_available: false,
      active_courses: landing.stats.courses, active_diplomas: landing.stats.diplomas, active_packages: landing.stats.packages,
      active_instructors: landing.stats.instructors, certificate_templates: 0, certificates_issued: 0,
      completed_course_enrollments: 0, students_with_completed_courses: 0, completed_course_count: 0,
    },
  };
}

/** One rail's worth of courses per top-level category, so each category chip can fill its rail. */
function getCategoryCourses(landing: Landing): CategoryCourses[] {
  return landing.categories.flatMap((category) =>
    category.legacy_category_id === null || category.legacy_category_id === undefined
      ? []
      : [{ categoryId: category.legacy_category_id, items: category.courses.map(cardToCourseDto).filter(isDto) }],
  );
}

/**
 * The bundle rail: the published bundles, each read in full for what it holds. Bundles number in
 * the tens; one that fails to load is left off.
 */
async function getBundles(): Promise<BundleLandingVM> {
  const page = await getCatalogProducts({ product_type: "bundle", limit: 50 }, cachedRead);
  const results = await Promise.allSettled(
    page.items.map((item) => getCatalogBundle(item.slug, LANDING_REVALIDATE_SECONDS, [LANDING_CACHE_TAG])),
  );
  const details = results
    .map((result, index) => valueOf(result, `bundle ${page.items[index].slug}`))
    .filter((detail): detail is CatalogBundleDetail => detail !== null);
  // The Studio page supplies the card's cover and its authored title/summary; 404 means none.
  const contents = await Promise.all(details.map(bundleContent));
  return mapBundleLanding(details, contents);
}

/** A bundle's published Studio page; 404 is expected and silently falls back to catalog fields. */
function bundleContent(detail: CatalogBundleDetail) {
  return getProductContent(detail.product.product_id, cachedRead).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    console.error(`[api] bundle ${detail.product.slug} content request failed`, error);
    return null;
  });
}

/**
 * Everything the landing page needs, in parallel requests (category rails follow the landing page,
 * which lists the categories). Each request fails independently: the page always renders, and
 * sections or filters without data simply don't appear.
 */
export const getLandingData = cache(async (): Promise<LandingData> => {
  const [landingResult, featuredResult, diplomasResult, packagesResult, consultationsResult, bundles, diplomaSearch, packageSearch, instructors, liveTrainings] =
    await Promise.allSettled([
      getCatalogLanding(cachedRead),
      getCatalogCards({ product_type: ["course"], limit: MAX_CARDS }, cachedRead),
      getAllCatalogCards({ product_type: ["diploma"] }, cachedRead),
      getAllCatalogCards({ product_type: ["package"] }, cachedRead),
      getAllCatalogCards({ product_type: ["consultation"] }, cachedRead),
      getBundles(),
      searchProducts({ product_type: ["diploma"], limit: SEARCH_PAGE_SIZE }, cachedRead),
      searchProducts({ product_type: ["package"], limit: SEARCH_PAGE_SIZE }, cachedRead),
      getInstructorNames(cachedRead),
      getFeaturedLiveTrainings(),
    ]);

  const rawLanding = valueOf(landingResult, "landing");
  const landing = rawLanding && normalise(rawLanding);
  const featured = valueOf(featuredResult, "featured courses") ?? { items: [], total: 0 };
  const diplomas = (valueOf(diplomasResult, "diplomas") ?? []).map(cardToCourseDto).filter(isDto);
  const packages = (valueOf(packagesResult, "packages") ?? []).map(cardToPackageDto).filter(isDto);
  const consultations = (valueOf(consultationsResult, "consultations") ?? []).map(cardToConsultationDto).filter(isDto);
  const page = <T,>(items: T[]) => ({ items, total: items.length, limit: items.length, offset: 0 });

  return mapLandingData({
    landing: landing && toLandingPage(landing, featured, diplomas, packages, consultations),
    categoryCourses: landing ? getCategoryCourses(landing) : [],
    activeDiplomas: page(diplomas),
    packages: page(packages),
    consultations: page(consultations),
    bundles: valueOf(bundles, "bundles"),
    diplomaIndex: toSearchIndex("diploma", valueOf(diplomaSearch, "diploma search")),
    packageIndex: toSearchIndex("package", valueOf(packageSearch, "package search")),
    instructors: valueOf(instructors, "instructor names") ?? new Map(),
    liveTrainings: valueOf(liveTrainings, "live trainings") ?? [],
  });
});
