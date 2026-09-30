import { brandCycle } from "@/components/ui/brand-colors";
import { routes } from "@/config/routes";
import { consultationCard, type ConsultationIndex } from "@/features/consultation-detail/model/mappers";
import { isPublishable, type CourseDto } from "@/features/landing/model/mappers";
import {
  courseCard,
  dedupe,
  packageCard,
  recommendationCard,
} from "@/features/product-detail/model/mappers";
import type { CatalogIndex, RailCardVM } from "@/features/product-detail/model/types";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type { LegacyExpertResponse, LegacyRecommendationsResponse } from "@/lib/api/legacy";
import { cleanText, stripHonorific, toPlainText, toTextBlocks } from "@/lib/format";

import type { ExpertDetailData, ExpertVM, SocialLinkVM } from "./types";

type ProfileDto = LegacyExpertResponse["expert"];
type RecommendationDto = LegacyRecommendationsResponse["items"][number];

const CONSULTATION_SLUG = /^consultation-(\d+)$/;
/** Specialty chips in the hero; more than this reads as a list, not a specialty. */
const MAX_SPECIALTIES = 4;

/** Cover colour from the key, so an expert keeps the same one on every visit. */
function coverColor(key: string) {
  const seed = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return brandCycle[seed % brandCycle.length];
}

function socialLinks(dto: ProfileDto): SocialLinkVM[] {
  const links: (SocialLinkVM | null)[] = [
    dto.facebook_url ? { kind: "facebook", href: dto.facebook_url } : null,
    dto.instagram_url ? { kind: "instagram", href: dto.instagram_url } : null,
    dto.youtube_url ? { kind: "youtube", href: dto.youtube_url } : null,
  ];
  // The API only passes http(s) links; checked again here because they end up in `href`.
  return links.filter((link): link is SocialLinkVM => link !== null && /^https?:\/\//i.test(link.href));
}

/** The expert's own specialty line when the catalog has one, otherwise the categories they work in. */
function specialties(detail: LegacyExpertResponse): string[] {
  const own = cleanText(toPlainText(detail.expert.specialized, 80));
  if (own) {
    return [own];
  }
  const names = detail.categories.map((category) => cleanText(category.name)).filter((name) => name !== null);
  return [...new Set(names)].slice(0, MAX_SPECIALTIES);
}

/** Takes one card from each list in turn, so a mixed rail shows every kind it has. */
function interleave(lists: RailCardVM[][]): RailCardVM[] {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, index) => lists.flatMap((list) => list.slice(index, index + 1))).flat();
}

/**
 * Recommendation slugs are `${kind}-${legacyId}` with no artwork or link name, so each card is
 * rebuilt from its catalog record; consultations come from their own index.
 */
function recommendedCard(
  dto: RecommendationDto,
  catalog: CatalogIndex | null,
  consultations: ConsultationIndex | null,
  instructors?: InstructorNames,
): RailCardVM | null {
  const consultationId = dto.slug.match(CONSULTATION_SLUG)?.[1];
  if (consultationId) {
    const consultation = consultations?.get(Number(consultationId));
    return consultation && isPublishable(consultation) ? consultationCard(consultation) : null;
  }
  return recommendationCard(dto, catalog, instructors);
}

export type ExpertDetailSources = {
  detail: LegacyExpertResponse;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  consultations: ConsultationIndex | null;
  instructors: InstructorNames | null;
};

export function mapExpertDetailData({
  detail,
  recommendations,
  catalog,
  consultations: consultationIndex,
  instructors,
}: ExpertDetailSources): ExpertDetailData {
  const dto = detail.expert;
  const name = cleanText(dto.name) ?? "";
  const toCourseCard = (course: CourseDto) => courseCard(course, instructors ?? undefined);

  // The expert's own items: everything published, in the API's order.
  const consultations = detail.consultations.filter(isPublishable).map(consultationCard);
  const courses = detail.courses.filter(isPublishable).map(toCourseCard);
  const diplomas = detail.diplomas.filter(isPublishable).map(toCourseCard);
  const packages = detail.packages.filter(isPublishable).map(packageCard);
  const own = [...consultations, ...courses, ...diplomas, ...packages];
  const seen = new Set(own.map((card) => card.key));

  const { related } = detail;
  const relatedPrograms = dedupe(
    interleave([
      (related.courses ?? []).filter(isPublishable).map(toCourseCard),
      (related.diplomas ?? []).filter(isPublishable).map(toCourseCard),
      (related.packages ?? []).filter(isPublishable).map(packageCard),
    ]),
    seen,
  );
  const relatedConsultations = dedupe(
    (related.consultations ?? []).filter(isPublishable).map(consultationCard),
    seen,
  );
  const recommended = dedupe(
    (recommendations?.items ?? [])
      .map((item) => recommendedCard(item, catalog, consultationIndex, instructors ?? undefined))
      .filter((card): card is RailCardVM => card !== null),
    seen,
  );

  const expert: ExpertVM = {
    key: dto.key,
    name,
    initial: stripHonorific(name).charAt(0) || name.charAt(0),
    avatar: dto.profile_image || null,
    cover: dto.cover_image || null,
    color: coverColor(dto.key),
    bio: [...toTextBlocks(dto.info), ...toTextBlocks(dto.more_info)],
    summary: toPlainText(dto.info ?? dto.more_info, 160),
    specialties: specialties(detail),
    socials: socialLinks(dto),
    counts: {
      courses: courses.length,
      diplomas: diplomas.length,
      packages: packages.length,
      consultations: consultations.length,
    },
    whatTheyDo: detail.highlights.what_i_do ?? [],
    whoTheyHelp: detail.highlights.who_i_help ?? [],
    href: routes.expert(dto.key, name),
    indexable: own.length > 0,
  };

  return { expert, consultations, courses, diplomas, packages, relatedPrograms, relatedConsultations, recommended };
}
