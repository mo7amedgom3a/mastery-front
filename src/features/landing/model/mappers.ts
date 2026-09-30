import { routes } from "@/config/routes";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type {
  LandingPageResponse,
  LegacyConsultationsResponse,
  LegacyDiplomasResponse,
  LegacyPackagesResponse,
} from "@/lib/api/legacy";
import type { SearchResponse } from "@/lib/api/search";
import {
  cleanText,
  formatDurationFromSeconds,
  formatMinutes,
  instructorLabel,
  toPlainText,
} from "@/lib/format";
import { resolvePriceRows, toPricing, type PriceRow } from "@/lib/pricing";

import type {
  BannerVM,
  CategoryVM,
  ConsultationCardVM,
  CourseCardVM,
  FaqVM,
  FilterVM,
  LandingData,
  PackageCardVM,
  StatVM,
} from "./types";

// Landing, course and diploma lists all return the same course schema (and packages share one too).
export type CourseDto = LandingPageResponse["courses"]["items"][number];
export type PackageDto = LandingPageResponse["packages"]["items"][number];
type SearchItemDto = SearchResponse["items"][number];
export type ConsultationDto = LandingPageResponse["consultations"]["items"][number];
type CategoryDto = LandingPageResponse["categories"][number];
type FaqDto = LandingPageResponse["faqs"][number];
type BannerDto = LandingPageResponse["banners"][number];
type InsightsDto = LandingPageResponse["insights"];

/** Cards per rail. */
export const MAX_CARDS = 12;

export function positiveOrNull(value: number | null | undefined): number | null {
  return value && value > 0 ? value : null;
}

/** Some legacy rows are admin tests ("test") or have no usable image; keep them off the storefront. */
export function isPublishable(item: { active: boolean; name?: string | null; image?: string | null }): boolean {
  const name = cleanText(item.name);
  return item.active && !!name && name.toLowerCase() !== "test" && !!item.image;
}

/**
 * Search-index facts about one product, keyed by legacy id. The index classifies every diploma and
 * package (the legacy rows mostly have no category) and knows package prices the legacy list lacks.
 */
type IndexEntry = { labels: string[]; price: number | null };
export type SearchIndex = Map<number, IndexEntry>;

/** Index slugs are `${kind}-${legacyId}`, e.g. `diploma-270`. */
export function toSearchIndex(kind: string, response: SearchResponse | null): SearchIndex {
  const index: SearchIndex = new Map();
  for (const item of response?.items ?? []) {
    const id = legacyIdFromSlug(kind, item);
    if (id === null) continue;
    const labels = item.categories.map((label) => cleanText(label)).filter((label): label is string => !!label);
    const price = item.price_amount === null || item.price_amount === undefined ? null : Number(item.price_amount);
    index.set(id, { labels, price: price !== null && Number.isFinite(price) ? price : null });
  }
  return index;
}

function legacyIdFromSlug(kind: string, item: SearchItemDto): number | null {
  const match = item.slug?.match(new RegExp(`^${kind}-(\\d+)$`));
  return match ? Number(match[1]) : null;
}

/**
 * Legacy rows carry a placeholder `price` of 0 when the real price lives in the price list, so
 * only a price-list row can say "free"; the bare column counts only when positive.
 * When the full price list is known (`rows`: the detail's `prices[]`), it decides, because the API's
 * own `current_price` drops main prices stored with a past window (see `resolvePriceRows`).
 * Returns the raw amounts: what is paid now, and the base price a running offer undercuts.
 */
export function priceAmounts(
  dto: CourseDto | PackageDto,
  rows?: readonly PriceRow[],
): { current: number | null; original: number | null } {
  const resolved = rows && rows.length > 0 ? resolvePriceRows(rows) : null;
  const current = resolved?.current?.price ?? dto.current_price?.price ?? positiveOrNull(dto.price);
  const original = resolved?.current ? resolved.original : dto.original_price;
  return { current: current ?? null, original: original ?? null };
}

export function coursePricing(dto: CourseDto, rows?: readonly PriceRow[]) {
  const { current, original } = priceAmounts(dto, rows);
  return { price: toPricing(current, original), priceAmount: positiveOrNull(current) };
}

/** Same rule as `coursePricing`: a package's `prices[]` (from its detail) decides when present. */
export function packagePricing(dto: PackageDto, rows?: readonly PriceRow[]) {
  const { current, original } = priceAmounts(dto, rows);
  return { price: toPricing(current, original), priceAmount: positiveOrNull(current) };
}

export function mapCourse(dto: CourseDto, filterKeys: string[] = [], instructors?: InstructorNames): CourseCardVM {
  return {
    id: dto.id,
    title: cleanText(dto.name) ?? "",
    summary: toPlainText(dto.description ?? dto.intro, 140),
    image: dto.image || dto.square_image || null,
    href: dto.is_diploma ? routes.diploma(dto.id, dto.link_name) : routes.course(dto.id, dto.link_name),
    category: cleanText(dto.category_name),
    duration: formatDurationFromSeconds(dto.duration),
    instructor: instructorLabel(instructors?.get(`${dto.is_diploma ? "diploma" : "course"}:${dto.id}`)),
    ...coursePricing(dto),
    filterKeys,
  };
}

export function mapPackage(dto: PackageDto, entry?: IndexEntry): PackageCardVM {
  // `current_price` needs the pricing-aware backend; until then the search index has the price.
  const current = dto.current_price?.price ?? positiveOrNull(dto.price) ?? positiveOrNull(entry?.price);
  return {
    id: dto.id,
    title: cleanText(dto.name) ?? "",
    summary: toPlainText(dto.description, 140),
    image: dto.image ?? null,
    href: routes.package(dto.id),
    courseCount: dto.course_count,
    price: toPricing(current, dto.original_price),
    priceAmount: positiveOrNull(current),
    filterKeys: entry?.labels ?? [],
  };
}

export function mapConsultation(dto: ConsultationDto, filterKeys: string[] = []): ConsultationCardVM {
  return {
    id: dto.id,
    title: cleanText(dto.name) ?? "",
    summary: toPlainText(dto.body, 140),
    image: dto.image ?? null,
    href: routes.consultation(dto.id),
    consultant: cleanText(dto.consultant_name),
    sessions: dto.number_of_sessions,
    sessionLength: formatMinutes(dto.session_duration),
    price: toPricing(dto.price),
    priceAmount: positiveOrNull(dto.price),
    filterKeys,
  };
}

function mapCategory(dto: CategoryDto): CategoryVM | null {
  const name = cleanText(dto.name);
  if (!name || dto.parent_id !== null) {
    return null;
  }
  return { id: dto.id, name, href: routes.category(dto.id) };
}

function mapFaq(dto: FaqDto): FaqVM | null {
  const question = cleanText(dto.question);
  const answer = toPlainText(dto.answer, 800);
  return question && answer ? { question, answer } : null;
}

function mapBanner(banners: BannerDto[]): BannerVM | null {
  const banner = [...banners]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .find((item) => cleanText(item.header) || cleanText(item.subtitle));
  if (!banner) {
    return null;
  }
  const text = [cleanText(banner.header), cleanText(banner.subtitle)].filter(Boolean).join(" — ");
  const href = banner.link_url && /^https?:\/\//.test(banner.link_url) ? banner.link_url : null;
  return { id: banner.id, text, href };
}

/** Only real, non-zero counters are shown; a "0 شهادة" stat hurts more than it helps. */
function mapStats(insights: InsightsDto | null | undefined): StatVM[] {
  if (!insights) {
    return [];
  }
  const candidates: StatVM[] = [
    { key: "courses", value: insights.active_courses, label: "دورة تدريبية" },
    { key: "instructors", value: insights.active_instructors, label: "خبير ومدرّب" },
    { key: "diplomas", value: insights.active_diplomas, label: "دبلوم احترافي" },
    { key: "packages", value: insights.active_packages, label: "باقة تعليمية" },
    { key: "certificates", value: insights.certificates_issued, label: "شهادة صادرة" },
    { key: "graduates", value: insights.students_with_completed_courses, label: "متعلّم أتمّ دوراته" },
  ];
  return candidates.filter((stat) => stat.value > 0).slice(0, 4);
}

/** Filter chips from item labels, most-used first; labels are both the key and the text. */
function labelFilters(items: { filterKeys: string[] }[]): FilterVM[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const key of item.filterKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .toSorted(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, "ar"))
    .map(([key]) => ({ key, label: key }));
}

export type CategoryCourses = { categoryId: number; items: CourseDto[] };

/**
 * The featured rail followed by each category's rail, one card per course: a course listed in
 * several categories carries all of their keys. Categories without courses get no chip.
 */
function mapCourseRails(
  featured: CourseDto[],
  categoryCourses: CategoryCourses[],
  categories: CategoryVM[],
  instructors: InstructorNames,
): { courses: CourseCardVM[]; filters: FilterVM[] } {
  const byId = new Map<number, CourseCardVM>();
  const add = (dto: CourseDto, key?: string) => {
    if (!isPublishable(dto)) return false;
    const course = byId.get(dto.id) ?? mapCourse(dto, [], instructors);
    if (key && !course.filterKeys.includes(key)) course.filterKeys.push(key);
    byId.set(dto.id, course);
    return true;
  };

  featured.slice(0, MAX_CARDS).forEach((dto) => add(dto));
  const filled = new Set<number>();
  for (const { categoryId, items } of categoryCourses) {
    const key = String(categoryId);
    if (items.map((dto) => add(dto, key)).some(Boolean)) filled.add(categoryId);
  }

  return {
    courses: [...byId.values()],
    filters: categories
      .filter((category) => filled.has(category.id))
      .map((category) => ({ key: String(category.id), label: category.name, href: category.href })),
  };
}

/**
 * Consultations under the chips of the top-level categories the API files them in (their own
 * categories plus the ones their consultant teaches in; sub-categories roll up to their parent).
 * Chips follow the category order and use the same keys as the course chips; categories without
 * consultations get none, and consultations the API can't place show under "الكل" only.
 */
function mapConsultationRail(
  items: ConsultationDto[],
  allCategories: CategoryDto[],
  categories: CategoryVM[],
): { consultations: ConsultationCardVM[]; filters: FilterVM[] } {
  const parentOf = new Map(allCategories.map((category) => [category.id, category.parent_id]));
  const topLevel = (id: number): number => {
    let current = id;
    // Bounded: a cycle in legacy data must not hang the page.
    for (let depth = 0; depth < 5; depth++) {
      const parent = parentOf.get(current);
      if (parent === null || parent === undefined) break;
      current = parent;
    }
    return current;
  };
  const consultations = items.filter(isPublishable).map((dto) => {
    const keys = [...new Set((dto.category_ids ?? []).map((id) => String(topLevel(id))))];
    return mapConsultation(dto, keys);
  });
  const filled = new Set(consultations.flatMap((consultation) => consultation.filterKeys));
  return {
    consultations,
    filters: categories
      .filter((category) => filled.has(String(category.id)))
      .map((category) => ({ key: String(category.id), label: category.name })),
  };
}

export const emptyLandingData: LandingData = {
  banner: null,
  categories: [],
  courses: [],
  courseFilters: [],
  coursesTotal: 0,
  diplomas: [],
  diplomaFilters: [],
  packages: [],
  packageFilters: [],
  consultations: [],
  consultationFilters: [],
  faqs: [],
  stats: [],
};

export type LandingSources = {
  landing: LandingPageResponse | null;
  categoryCourses: CategoryCourses[];
  activeDiplomas: LegacyDiplomasResponse | null;
  packages: LegacyPackagesResponse | null;
  /** Every consultation; the landing aggregate only carries the first few. */
  consultations: LegacyConsultationsResponse | null;
  diplomaIndex: SearchIndex;
  packageIndex: SearchIndex;
  instructors: InstructorNames;
};

export function mapLandingData({
  landing,
  categoryCourses,
  activeDiplomas,
  packages: allPackages,
  consultations: allConsultations,
  diplomaIndex,
  packageIndex,
  instructors,
}: LandingSources): LandingData {
  if (!landing && !activeDiplomas && !allPackages && !allConsultations) {
    return emptyLandingData;
  }

  const categories = (landing?.categories ?? [])
    .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(mapCategory)
    .filter((category): category is CategoryVM => category !== null);

  const courseRails = mapCourseRails(landing?.courses.items ?? [], categoryCourses, categories, instructors);

  // The aggregate endpoint returns featured diplomas regardless of status; prefer the active list.
  const diplomaSource = activeDiplomas?.items ?? landing?.diplomas.items ?? [];
  const diplomas = diplomaSource.filter(isPublishable).map((dto) => {
    const category = cleanText(dto.category_name);
    return mapCourse(dto, diplomaIndex.get(dto.id)?.labels ?? (category ? [category] : []), instructors);
  });

  const packageSource = allPackages?.items ?? landing?.packages.items ?? [];
  const packages = packageSource.filter(isPublishable).map((dto) => mapPackage(dto, packageIndex.get(dto.id)));

  // The full list lets every chip fill its rail; the aggregate's few are the fallback.
  const consultationRail = mapConsultationRail(
    allConsultations?.items ?? landing?.consultations.items ?? [],
    landing?.categories ?? [],
    categories,
  );

  return {
    banner: landing ? mapBanner(landing.banners) : null,
    categories,
    courses: courseRails.courses,
    courseFilters: courseRails.filters,
    coursesTotal: landing?.courses.total ?? 0,
    diplomas,
    diplomaFilters: labelFilters(diplomas),
    packages,
    packageFilters: labelFilters(packages),
    consultations: consultationRail.consultations,
    consultationFilters: consultationRail.filters,
    faqs: (landing?.faqs ?? []).map(mapFaq).filter((faq): faq is FaqVM => faq !== null),
    stats: mapStats(landing?.insights),
  };
}
