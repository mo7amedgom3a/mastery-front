import type { Route } from "next";

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
import { expertColorIndex, mapExpertCard } from "@/features/experts-directory/model";
import type { CatalogCard, CatalogExpertDetail } from "@/lib/api/browse";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type { LegacyExpertResponse, LegacyRecommendationsResponse } from "@/lib/api/legacy";
import { cleanText, stripHonorific, toPlainText, toTextBlocks } from "@/lib/format";
import { toPricing } from "@/lib/pricing";

import { expertRoles } from "./facts";
import { programCardIndex, resolveProgramCards } from "./page-document";
import { studioSections, type StudioBlock } from "@/features/product-detail/model/studio-content";
import type { ExpertDetailData, ExpertFieldVM, ExpertVM, LinkCardVM, SocialLinkVM } from "./types";

type ProfileDto = LegacyExpertResponse["expert"];
type RecommendationDto = LegacyRecommendationsResponse["items"][number];

const CONSULTATION_SLUG = /^consultation-(\d+)$/;
/** Specialty chips in the hero; more than this reads as a list, not a specialty. */
const MAX_SPECIALTIES = 4;

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

/** A bundle or live diploma card; it has no cart controls here, its own page sells it. */
function linkCard(card: CatalogCard, kind: LinkCardVM["kind"]): LinkCardVM {
  return {
    key: `${kind}:${card.slug}`,
    kind,
    title: cleanText(card.title) ?? card.slug,
    summary: toPlainText(card.short_description, 160),
    image: card.image ?? null,
    href: kind === "bundle" ? routes.bundle(card.slug) : routes.liveTraining(card.slug),
    tag: kind === "bundle" ? "حزمة" : "برنامج مباشر",
    price: toPricing(card.price?.amount, card.price?.compare_at_amount),
  };
}

/** A field links to its course listing: legacy categories by id, B2C ones by slug. */
function fieldOf(item: NonNullable<CatalogExpertDetail["category_items"]>[number]): ExpertFieldVM {
  const href: Route | null = item.legacy_category_id
    ? routes.category(item.legacy_category_id)
    : item.slug
      ? routes.categoryOf("course", item.slug)
      : null;
  return { name: item.name.trim(), href };
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
  /** The B2C profile itself, for what the legacy shape has no room for (README, bundles, related experts). */
  b2c: CatalogExpertDetail;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  consultations: ConsultationIndex | null;
  instructors: InstructorNames | null;
};

export function mapExpertDetailData({
  detail,
  b2c,
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
  const bundles = (b2c.bundles ?? []).map((card) => linkCard(card, "bundle"));
  const liveDiplomas = (b2c.live_diplomas ?? []).map((card) => linkCard(card, "live"));
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

  const profile = b2c.expert;
  const counts = {
    courses: courses.length,
    diplomas: diplomas.length,
    packages: packages.length,
    consultations: consultations.length,
    bundles: bundles.length,
    live: liveDiplomas.length,
  };
  const isConsultant = Boolean(profile.is_consultant);
  const programs = programCardIndex([
    ...(b2c.courses ?? []), ...(b2c.diplomas ?? []), ...(b2c.live_diplomas ?? []),
    ...(b2c.packages ?? []), ...(b2c.bundles ?? []), ...(b2c.consultations ?? []),
  ]);
  const document = Array.isArray(profile.document) ? (profile.document as unknown as StudioBlock[]) : null;
  const readme = profile.readme?.trim() ?? "";
  const title = cleanText(profile.headline);
  const expert: ExpertVM = {
    key: dto.key,
    name,
    initial: stripHonorific(name).charAt(0) || name.charAt(0),
    avatar: dto.profile_image || null,
    colorIndex: expertColorIndex(dto.key),
    title,
    roles: expertRoles(counts, isConsultant),
    isConsultant,
    page: document?.length ? studioSections(resolveProgramCards(document, programs)) : [],
    document,
    readme,
    bio: readme ? [] : [...toTextBlocks(dto.info), ...toTextBlocks(dto.more_info)],
    summary: title ?? toPlainText(readme || dto.info || dto.more_info, 160),
    fields: (b2c.category_items ?? []).map(fieldOf),
    topics: [...new Set([...(b2c.skills ?? []), ...(b2c.tags ?? [])].map((topic) => topic.name.trim()).filter(Boolean))].slice(0, 16),
    specialties: specialties(detail),
    socials: socialLinks(dto),
    counts,
    whatTheyDo: detail.highlights.what_i_do ?? [],
    whoTheyHelp: detail.highlights.who_i_help ?? [],
    href: routes.expert(dto.key, name),
    indexable: own.length + bundles.length + liveDiplomas.length > 0,
  };

  return {
    expert,
    consultations,
    courses,
    diplomas,
    packages,
    bundles,
    liveDiplomas,
    programs: [...programs.values()],
    relatedExperts: (b2c.related_experts ?? []).map(mapExpertCard),
    relatedPrograms,
    relatedConsultations,
    recommended,
  };
}
