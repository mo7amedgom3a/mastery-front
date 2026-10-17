import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { QueryParams, SuccessResponse } from "@/lib/api/operation-types";
import type { LandingPageResponse } from "@/lib/api/legacy";

/*
 * B2C browse API (`/catalog/cards`, `/catalog/experts`, `/catalog/landing`): slim product cards and expert
 * profiles read from `b2c.*`. The card adapters below give the card rails, landing and expert pages the same
 * DTO shapes their mappers already read, so only the data source changes.
 */

type CardsOperation = "product_cards_api_v1_catalog_cards_get";
type ExpertsOperation = "experts_api_v1_catalog_experts_get";
type ExpertOperation = "expert_api_v1_catalog_experts__key__get";
type LandingOperation = "landing_api_v1_catalog_landing_get";

export type CatalogCardsParams = QueryParams<CardsOperation>;
export type CatalogCardsResponse = SuccessResponse<CardsOperation>;
export type CatalogCard = CatalogCardsResponse["items"][number];
export type CatalogExpertSummary = SuccessResponse<ExpertsOperation>[number];
export type CatalogExpertDetail = SuccessResponse<ExpertOperation>;
export type CatalogLanding = SuccessResponse<LandingOperation>;

type CourseDto = LandingPageResponse["courses"]["items"][number];
type PackageDto = LandingPageResponse["packages"]["items"][number];
type ConsultationDto = LandingPageResponse["consultations"]["items"][number];

const PAGE_SIZE = 200;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 10;

export function getCatalogCards(params: CatalogCardsParams, options?: ApiRequestOptions): Promise<CatalogCardsResponse> {
  return apiRequest<CatalogCardsResponse>("GET", "/api/v1/catalog/cards", { ...options, query: params });
}

/** Every card matching the filter, paging as needed. */
export async function getAllCatalogCards(
  params: Omit<CatalogCardsParams, "limit" | "offset">,
  options?: ApiRequestOptions,
): Promise<CatalogCard[]> {
  const items: CatalogCard[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await getCatalogCards({ ...params, limit: PAGE_SIZE, offset: page * PAGE_SIZE }, options);
    items.push(...result.items);
    if (result.items.length < PAGE_SIZE || items.length >= result.total) break;
  }
  return items;
}

export function getCatalogExperts(
  params: { limit?: number; offset?: number } = {},
  options?: ApiRequestOptions,
): Promise<SuccessResponse<ExpertsOperation>> {
  return apiRequest("GET", "/api/v1/catalog/experts", { ...options, query: params });
}

export function getCatalogExpert(key: string, options?: ApiRequestOptions): Promise<CatalogExpertDetail> {
  return apiRequest("GET", "/api/v1/catalog/experts/{key}", { ...options, path: { key } });
}

export function getCatalogLanding(options?: ApiRequestOptions): Promise<CatalogLanding> {
  return apiRequest("GET", "/api/v1/catalog/landing", options);
}

const NUMBERED = /^(course|diploma|package|consultation)-(\d+)$/;

/** `course-50` → { kind: "course", id: 50 }; null for slugs without a numeric id (B2C-native products). */
export function parseCardSlug(slug: string): { kind: "course" | "diploma" | "package" | "consultation"; id: number } | null {
  const match = slug.match(NUMBERED);
  return match ? { kind: match[1] as "course" | "diploma" | "package" | "consultation", id: Number(match[2]) } : null;
}

function priceOf(card: CatalogCard): CourseDto["current_price"] {
  return card.price
    ? { id: 0, price: card.price.amount, name: null, active: true, is_main: true, starts_at: null, ends_at: null }
    : null;
}

/** A course/diploma card in the shape the course mappers read; null when the slug has no numeric id. */
export function cardToCourseDto(card: CatalogCard): CourseDto | null {
  const parsed = parseCardSlug(card.slug);
  if (!parsed || (parsed.kind !== "course" && parsed.kind !== "diploma")) return null;
  return {
    id: parsed.id,
    name: card.title,
    description: card.short_description,
    intro: card.short_description,
    category_id: null,
    category_name: card.category,
    image: card.image,
    square_image: card.image,
    link_name: null,
    price: card.price?.amount ?? null,
    active: true,
    featured: null,
    is_diploma: parsed.kind === "diploma",
    duration: card.duration_seconds ? card.duration_seconds / 3600 : null,
    rating: null,
    current_price: priceOf(card),
    original_price: card.price?.compare_at_amount ?? null,
  };
}

export function cardToPackageDto(card: CatalogCard): PackageDto | null {
  const parsed = parseCardSlug(card.slug);
  if (!parsed || parsed.kind !== "package") return null;
  return {
    id: parsed.id,
    name: card.title,
    description: card.short_description,
    image: card.image,
    active: true,
    show_in_listing: true,
    show_in_courses_listing: true,
    price: card.price?.amount ?? null,
    course_count: 0,
    source: "b2c",
    category_id: null,
    current_price: priceOf(card),
    original_price: card.price?.compare_at_amount ?? null,
  };
}

export function cardToConsultationDto(card: CatalogCard): ConsultationDto | null {
  const parsed = parseCardSlug(card.slug);
  if (!parsed || parsed.kind !== "consultation") return null;
  return {
    id: parsed.id,
    name: card.title,
    body: card.short_description,
    image: card.image,
    active: true,
    price: card.price?.amount ?? 0,
    number_of_sessions: 1,
    session_duration: 0,
    consultant_id: null,
    consultant_name: card.instructor_name,
    available_slot_count: 0,
    instructor_id: null,
    expert_key: card.instructor_key,
    category_ids: [],
  };
}
