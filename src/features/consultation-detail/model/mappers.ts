import { routes } from "@/config/routes";
import {
  isPublishable,
  mapConsultation,
  type ConsultationDto,
  type CourseDto,
  type PackageDto,
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
  LegacyInstructorsResponse,
  LegacyRecommendationsResponse,
  LegacyRelatedResponse,
} from "@/lib/api/legacy";
import { cleanText, formatMinutes, stripHonorific, toPlainText, toTextBlocks } from "@/lib/format";

import { sessionsLabel } from "./facts";
import type { AvailabilityVM, ConsultationDetailData, ConsultationDetailVM, ExpertVM } from "./types";

type DetailDto = LegacyConsultationResponse;
export type InstructorDto = LegacyInstructorsResponse["items"][number];
export type ConsultationIndex = Map<number, ConsultationDto>;

/** Below this, the consultations rail is topped up from the rest of the catalog. */
const MIN_CONSULTATION_CARDS = 4;
const CONSULTATION_SLUG = /^consultation-(\d+)$/;

/**
 * Key for matching a consultant to an instructor profile. Consultants have their own id space
 * (`consultant_id` is not an instructor id), so the two are joined on the name without its honorific.
 */
export function expertNameKey(name: string | null | undefined): string | null {
  const clean = cleanText(name);
  return clean ? stripHonorific(clean).trim() || clean : null;
}

/** The consultant, with the photo, bio and profile link of the matching instructor when there is one. */
export function mapExpert(dto: DetailDto["consultation"], instructor: InstructorDto | null): ExpertVM | null {
  const name = cleanText(dto.consultant_name);
  if (!name) {
    return null;
  }
  return {
    // Without a profile, the consultant id only keys the list; it is never used to build a link.
    id: instructor?.id ?? dto.consultant_id ?? 0,
    name,
    initial: stripHonorific(name).charAt(0) || name.charAt(0),
    avatar: instructor?.profile_image || null,
    bio: toTextBlocks(instructor?.info),
    summary: toPlainText(instructor?.info, 160),
    href: instructor ? routes.instructor(instructor.id) : null,
  };
}

export function mapConsultationDetail(
  dto: DetailDto,
  instructor: InstructorDto | null,
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
    expert: mapExpert(consultation, instructor),
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

export type ExpertPrograms = { courses: CourseDto[]; diplomas: CourseDto[]; packages: PackageDto[] };

export type ConsultationDetailSources = {
  detail: DetailDto;
  instructor: InstructorDto | null;
  availability: AvailabilityVM;
  /** Every consultation, for the same-expert cards and for rebuilding recommendation cards. */
  consultations: ConsultationIndex | null;
  /** What the matched instructor teaches. */
  programs: ExpertPrograms | null;
  related: LegacyRelatedResponse | null;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  instructors: InstructorNames | null;
};

export function mapConsultationDetailData({
  detail,
  instructor,
  availability,
  consultations,
  programs,
  related,
  recommendations,
  catalog,
  instructors,
}: ConsultationDetailSources): ConsultationDetailData {
  const consultation = mapConsultationDetail(detail, instructor, availability);
  const seen = new Set([`consultation:${consultation.id}`]);
  const recommended = recommendations?.items ?? [];
  const all = [...(consultations?.values() ?? [])].filter(isPublishable);

  // Consultations: this expert's other ones, then what the catalog and the engine link to it.
  const expertKey = expertNameKey(detail.consultation.consultant_name);
  const sameExpert = expertKey ? all.filter((dto) => expertNameKey(dto.consultant_name) === expertKey) : [];
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
  const courses = [...(programs?.courses ?? []), ...(related?.courses ?? [])].filter(isPublishable).map(toCourseCard);
  const diplomas = [...(programs?.diplomas ?? []), ...(related?.diplomas ?? [])].filter(isPublishable).map(toCourseCard);
  const packages = [...(programs?.packages ?? []), ...(related?.packages ?? [])].filter(isPublishable).map(packageCard);
  const recommendedPrograms = recommended
    .map((item) => recommendationCard(item, catalog, instructors ?? undefined))
    .filter((card): card is RailCardVM => card !== null);

  return {
    consultation,
    relatedConsultations,
    programs: dedupe([...courses, ...diplomas, ...packages, ...recommendedPrograms], seen),
  };
}
