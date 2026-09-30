import { routes } from "@/config/routes";
import {
  isPublishable,
  mapConsultation,
  type ConsultationDto,
  type CourseDto,
} from "@/features/landing/model/mappers";
import {
  byOrder,
  courseCard,
  dedupe,
  mapInfo,
  packageCard,
  recommendationCard,
} from "@/features/product-detail/model/mappers";
import type { CatalogIndex, InfoSectionVM, RailCardVM } from "@/features/product-detail/model/types";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type {
  LegacyConsultationResponse,
  LegacyExpertResponse,
  LegacyRecommendationsResponse,
  LegacyRelatedResponse,
} from "@/lib/api/legacy";
import { cleanText, formatMinutes, stripHonorific, toPlainText, toTextBlocks } from "@/lib/format";

import { sessionsLabel } from "./facts";
import type { AvailabilityVM, ConsultationDetailData, ConsultationDetailVM, ExpertVM } from "./types";

type DetailDto = LegacyConsultationResponse;
/** The consultant's public profile (`/legacy/experts/{expert_key}`): who they are and what else they offer. */
export type ExpertDto = LegacyExpertResponse;
export type ConsultationIndex = Map<number, ConsultationDto>;

/** Below this, the consultations rail is topped up from the rest of the catalog. */
const MIN_CONSULTATION_CARDS = 4;
const CONSULTATION_SLUG = /^consultation-(\d+)$/;

/**
 * The consultant, with the photo, bio and profile link from their expert profile. The API decides
 * who that is (`expert_key`); without the profile (its request failed) only the name is shown.
 */
export function mapExpert(dto: DetailDto["consultation"], expert: ExpertDto | null): ExpertVM | null {
  const name = cleanText(dto.consultant_name);
  if (!name) {
    return null;
  }
  const profile = expert?.expert;
  return {
    // Only keys the list; links are built from the expert key.
    id: dto.instructor_id ?? dto.consultant_id ?? 0,
    name,
    initial: stripHonorific(name).charAt(0) || name.charAt(0),
    avatar: profile?.profile_image || null,
    bio: toTextBlocks(profile?.info),
    summary: toPlainText(profile?.info, 160),
    href: profile ? routes.expert(profile.key, cleanText(profile.name)) : null,
  };
}

export function mapConsultationDetail(
  dto: DetailDto,
  expert: ExpertDto | null,
  availability: AvailabilityVM,
): ConsultationDetailVM {
  const { consultation } = dto;
  const card = mapConsultation(consultation);
  const info = dto.info.toSorted(byOrder);
  // `body` is empty across the catalog; the intro block is the consultation's real description.
  const intro = consultation.body ?? info[0]?.body;

  return {
    id: card.id,
    title: card.title,
    summary: toPlainText(intro, 240),
    description: toPlainText(intro, 160),
    image: card.image,
    price: card.price,
    priceAmount: card.priceAmount,
    sessions: card.sessions,
    sessionMinutes: consultation.session_duration,
    sessionLength: formatMinutes(consultation.session_duration),
    sections: info.map(mapInfo).filter((section): section is InfoSectionVM => section !== null),
    expert: mapExpert(consultation, expert),
    availability,
    href: card.href,
    indexable: consultation.active,
  };
}

export function consultationCard(dto: ConsultationDto): RailCardVM {
  const card = mapConsultation(dto);
  const sessions = sessionsLabel(card.sessions);
  return {
    key: `consultation:${card.id}`,
    kind: "consultation",
    id: card.id,
    title: card.title,
    summary: card.summary ?? (card.consultant ? `جلسة فردية عبر اجتماع مرئي مع ${card.consultant}.` : null),
    image: card.image,
    href: card.href,
    tag: "استشارة",
    duration: [sessions, card.sessionLength].filter(Boolean).join(" · ") || null,
    courseCount: null,
    instructor: card.consultant,
    price: card.price,
    priceAmount: card.priceAmount,
  };
}

export type ConsultationDetailSources = {
  detail: DetailDto;
  /** The consultant's profile, with their other consultations and what they teach. */
  expert: ExpertDto | null;
  availability: AvailabilityVM;
  /** Every consultation, for rebuilding recommendation cards and topping up the rail. */
  consultations: ConsultationIndex | null;
  related: LegacyRelatedResponse | null;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  instructors: InstructorNames | null;
};

export function mapConsultationDetailData({
  detail,
  expert,
  availability,
  consultations,
  related,
  recommendations,
  catalog,
  instructors,
}: ConsultationDetailSources): ConsultationDetailData {
  const consultation = mapConsultationDetail(detail, expert, availability);
  const seen = new Set([`consultation:${consultation.id}`]);
  const recommended = recommendations?.items ?? [];
  const all = [...(consultations?.values() ?? [])].filter(isPublishable);

  // Consultations: this expert's other ones, then what the catalog and the engine link to it.
  const expertKey = detail.consultation.expert_key;
  // The profile lists them; if its request failed, the index still knows who shares the key.
  const sameExpert =
    expert?.consultations.filter(isPublishable) ??
    (expertKey ? all.filter((dto) => dto.expert_key === expertKey) : []);
  const recommendedConsultations = recommended.flatMap((item) => {
    const id = item.slug.match(CONSULTATION_SLUG)?.[1];
    const dto = id ? consultations?.get(Number(id)) : undefined;
    return dto && isPublishable(dto) ? [dto] : [];
  });
  const relatedConsultations = dedupe(
    [...sameExpert, ...(related?.consultations ?? []).filter(isPublishable), ...recommendedConsultations].map(
      consultationCard,
    ),
    seen,
  );
  if (relatedConsultations.length < MIN_CONSULTATION_CARDS) {
    // A short rail reads as broken: fill it from the rest of the catalog.
    const fill = dedupe(all.map(consultationCard), seen);
    relatedConsultations.push(...fill.slice(0, MIN_CONSULTATION_CARDS - relatedConsultations.length));
  }

  // Programs: what the expert teaches first, then related and recommended ones.
  const toCourseCard = (dto: CourseDto) => courseCard(dto, instructors ?? undefined);
  const courses = [...(expert?.courses ?? []), ...(related?.courses ?? [])].filter(isPublishable).map(toCourseCard);
  const diplomas = [...(expert?.diplomas ?? []), ...(related?.diplomas ?? [])].filter(isPublishable).map(toCourseCard);
  const packages = [...(expert?.packages ?? []), ...(related?.packages ?? [])].filter(isPublishable).map(packageCard);
  const recommendedPrograms = recommended
    .map((item) => recommendationCard(item, catalog, instructors ?? undefined))
    .filter((card): card is RailCardVM => card !== null);

  return {
    consultation,
    relatedConsultations,
    programs: dedupe([...courses, ...diplomas, ...packages, ...recommendedPrograms], seen),
  };
}
