import { routes } from "@/config/routes";
import {
  coursePricing,
  isPublishable,
  mapCourse,
  mapPackage,
  type CourseDto,
  type PackageDto,
} from "@/features/landing/model/mappers";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type { LegacyCourseResponse, LegacyRecommendationsResponse, LegacyRelatedResponse } from "@/lib/api/legacy";
import { cleanText, formatClock, formatDurationFromSeconds, toPlainText, toTextBlocks, type TextBlock } from "@/lib/format";

import type {
  CatalogIndex,
  InfoSectionVM,
  IntroVideoSource,
  ProductDetailData,
  ProductDetailVM,
  ProductKind,
  RailCardVM,
  TrainerVM,
  UnitVM,
} from "./types";

type DetailDto = LegacyCourseResponse;
type InfoDto = DetailDto["info"][number];
type UnitDto = DetailDto["units"][number];
type TrainerDto = DetailDto["trainers"][number];
type RecommendationDto = LegacyRecommendationsResponse["items"][number];

/** Cards per rail. */
export const MAX_RAIL_CARDS = 8;

/** Ratings below this read as a warning, not a recommendation; they are left off the page. */
const MIN_SHOWN_RATING = 4;

export function kindOf(dto: DetailDto): ProductKind {
  return dto.course.is_diploma ? "diploma" : "course";
}

export function productHref(kind: ProductKind, id: number, linkName?: string | null) {
  return kind === "diploma" ? routes.diploma(id, linkName) : routes.course(id, linkName);
}

/** Shorter than this, a block is a CMS placeholder ("ماهي الباقة ؟"), not content. */
const MIN_INFO_TEXT = 40;

function infoVariant(heading: string): InfoSectionVM["variant"] {
  if (heading.includes("أهداف")) return "goals";
  if (heading.includes("لمن") || heading.includes("المستهدف")) return "audience";
  return "prose";
}

function textLength(blocks: readonly TextBlock[]): number {
  return blocks.reduce((sum, block) => sum + (block.type === "p" ? block.text : block.items.join("")).length, 0);
}

export function mapInfo(dto: InfoDto): InfoSectionVM | null {
  // Headings are often typed with a trailing colon ("الأهداف:").
  const heading = cleanText(dto.header)?.replace(/\s*[:：]\s*$/, "") || null;
  const blocks = toTextBlocks(dto.body);
  if (!heading || textLength(blocks) < MIN_INFO_TEXT) {
    return null;
  }
  return { heading, blocks, variant: infoVariant(heading) };
}

export function byOrder<T extends { order?: number | null; id: number }>(a: T, b: T): number {
  return (a.order ?? 0) - (b.order ?? 0) || a.id - b.id;
}

function mapUnit(dto: UnitDto): UnitVM | null {
  const title = cleanText(dto.name);
  if (!title) {
    return null;
  }
  const materials = dto.materials.toSorted(byOrder);
  const seconds = dto.duration || materials.reduce((sum, material) => sum + (material.duration ?? 0), 0);
  return {
    id: dto.id,
    title,
    summary: toPlainText(dto.description, 240),
    duration: formatDurationFromSeconds(seconds),
    lessons: materials.map((material, index) => ({
      id: material.id,
      title: cleanText(material.name) ?? `الدرس ${index + 1}`,
      duration: formatClock(material.duration),
      free: material.is_free === true,
    })),
  };
}

export function mapTrainer(dto: TrainerDto): TrainerVM | null {
  const name = cleanText(dto.name);
  if (!name) {
    return null;
  }
  // Legacy names carry an honorific ("أ. كريم عصام"); the initial comes from the name itself.
  const initial = name.replace(/^(?:أ\.?\s*د\.?|أ\.|د\.|م\.)\s*/u, "").charAt(0) || name.charAt(0);
  return {
    id: dto.id,
    name,
    initial,
    avatar: dto.profile_image || null,
    bio: toTextBlocks(dto.info),
    summary: toPlainText(dto.info, 160),
    href: routes.instructor(dto.id),
  };
}

const VIDEO_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The course/diploma promo video (`promo_video_id`: the old site's `courseVideo`, stored in the legacy
 * course's `banner` column). Not `intro_video`, which is the first lesson and lives in another Bunny
 * library. The id is still verified against the promo library before the page shows a player.
 */
export function introVideoSource(detail: DetailDto): IntroVideoSource | null {
  const videoId = detail.promo_video_id?.trim();
  if (!videoId || !VIDEO_GUID.test(videoId)) {
    return null;
  }
  return { videoId, title: `الفيديو التعريفي: ${cleanText(detail.course.name) ?? ""}`, duration: null };
}

export function mapProductDetail(dto: DetailDto): ProductDetailVM {
  const { course } = dto;
  const kind = kindOf(dto);
  const title = cleanText(course.name) ?? "";
  const curriculum = dto.units
    .toSorted(byOrder)
    .map(mapUnit)
    .filter((unit): unit is UnitVM => unit !== null);
  const lessons = curriculum.flatMap((unit) => unit.lessons);
  const rating = course.rating && course.rating >= MIN_SHOWN_RATING ? Math.round(course.rating * 10) / 10 : null;

  return {
    kind,
    id: course.id,
    title,
    summary: toPlainText(course.description ?? course.intro, 240),
    description: toPlainText(course.description ?? course.intro ?? dto.info[0]?.body, 160),
    category: cleanText(course.category_name),
    image: course.image || course.square_image || null,
    duration: formatDurationFromSeconds(course.duration),
    rating,
    ...coursePricing(course, dto.prices),
    lessonCount: lessons.length,
    freeLessonCount: lessons.filter((lesson) => lesson.free).length,
    introVideo: null,
    sections: dto.info
      .toSorted(byOrder)
      .map(mapInfo)
      .filter((section): section is InfoSectionVM => section !== null),
    curriculum,
    trainers: dto.trainers.map(mapTrainer).filter((trainer): trainer is TrainerVM => trainer !== null),
    href: productHref(kind, course.id, course.link_name),
    indexable: course.active,
  };
}

export function courseCard(dto: CourseDto, instructors?: InstructorNames): RailCardVM {
  const card = mapCourse(dto, [], instructors);
  const kind = dto.is_diploma ? "diploma" : "course";
  return {
    key: `${kind}:${card.id}`,
    kind,
    id: card.id,
    title: card.title,
    summary: card.summary,
    image: card.image,
    href: card.href,
    tag: kind === "diploma" ? "دبلوم" : card.category,
    duration: card.duration,
    courseCount: null,
    instructor: card.instructor,
    price: card.price,
    priceAmount: card.priceAmount,
  };
}

export function packageCard(dto: PackageDto): RailCardVM {
  const card = mapPackage(dto);
  return {
    key: `package:${card.id}`,
    kind: "package",
    id: card.id,
    title: card.title,
    summary: card.summary,
    image: card.image,
    href: card.href,
    tag: "باقة",
    duration: null,
    courseCount: card.courseCount > 0 ? card.courseCount : null,
    instructor: null,
    price: card.price,
    priceAmount: card.priceAmount,
  };
}

const RECOMMENDATION_SLUG = /^(course|diploma|package)-(\d+)$/;

/**
 * Recommendation slugs are `${kind}-${legacyId}`, but the cards themselves have no artwork, link name
 * or trustworthy price. Each one is rebuilt from its legacy record, so it looks and links like every
 * other card; items missing from the catalog, or without artwork, are dropped (same rule as the rails).
 */
export function recommendationCard(
  dto: RecommendationDto,
  catalog: CatalogIndex | null,
  instructors?: InstructorNames,
): RailCardVM | null {
  const match = dto.slug.match(RECOMMENDATION_SLUG);
  if (!match || !catalog) {
    return null;
  }
  const key = `${match[1]}:${match[2]}`;
  const course = catalog.courses.get(key);
  if (course) {
    return isPublishable(course) ? courseCard(course, instructors) : null;
  }
  const pkg = catalog.packages.get(key);
  return pkg && isPublishable(pkg) ? packageCard(pkg) : null;
}

/** Keeps the first card per key and drops keys already shown (the product itself, earlier rails). */
export function dedupe(cards: RailCardVM[], seen: Set<string>): RailCardVM[] {
  const kept: RailCardVM[] = [];
  for (const card of cards) {
    // Only cards actually shown are marked seen, so items cut from one rail can fill the next.
    if (kept.length === MAX_RAIL_CARDS) break;
    if (seen.has(card.key)) continue;
    seen.add(card.key);
    kept.push(card);
  }
  return kept;
}

export type ProductDetailSources = {
  detail: DetailDto;
  related: LegacyRelatedResponse | null;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  instructors: InstructorNames | null;
};

export function mapProductDetailData({
  detail,
  related,
  recommendations,
  catalog,
  instructors,
}: ProductDetailSources): ProductDetailData {
  const product = mapProductDetail(detail);
  const seen = new Set([`${product.kind}:${product.id}`]);

  // Same kind first: a course page leads with courses, a diploma page with diplomas.
  const toCourseCard = (dto: CourseDto) => courseCard(dto, instructors ?? undefined);
  const courses = (related?.courses ?? []).filter(isPublishable).map(toCourseCard);
  const diplomas = (related?.diplomas ?? []).filter(isPublishable).map(toCourseCard);
  const packages = (related?.packages ?? []).filter(isPublishable).map(packageCard);
  const relatedCards = dedupe(
    product.kind === "diploma" ? [...diplomas, ...courses, ...packages] : [...courses, ...diplomas, ...packages],
    seen,
  );

  const recommended = dedupe(
    (recommendations?.items ?? [])
      .map((item) => recommendationCard(item, catalog, instructors ?? undefined))
      .filter((card): card is RailCardVM => card !== null),
    seen,
  );

  return { product, related: relatedCards, recommended };
}
