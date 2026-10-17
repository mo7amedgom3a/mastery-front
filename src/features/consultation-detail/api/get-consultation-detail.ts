import "server-only";

import { cache } from "react";

import { expertCacheTag, toLegacyShape } from "@/features/expert-detail/api/get-expert-detail";
import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { getAvailability } from "@/lib/api/consultations";
import { getCatalogExpert } from "@/lib/api/browse";
import { getCatalogProduct, type CatalogProductResponse } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { getInstructorNames } from "@/lib/api/instructor-names";
import type { LegacyConsultationResponse } from "@/lib/api/legacy";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { consultationProductRef } from "../model/availability";
import { mapConsultationDetailData } from "../model/mappers";
import type { ConsultationDetailData } from "../model/types";
import { getConsultationIndex } from "./get-consultation-index";

/** Keep in sync with the consultation page's `revalidate`. */
const CONSULTATION_REVALIDATE_SECONDS = 300;

const tagOf = (id: number) => `consultation-${id}`;

/** The consultation in the shape the mapper reads, from the B2C product (`/catalog/products/consultation-<id>`). */
function toLegacyConsultation(id: number, product: CatalogProductResponse): LegacyConsultationResponse {
  const info = product.consultation;
  return {
    consultation: {
      id,
      name: product.product.title ?? null,
      body: product.product.short_description ?? null,
      image: product.image ?? info?.consultant_avatar ?? null,
      active: product.product.status === "published",
      price: product.price?.amount ?? 0,
      number_of_sessions: 1,
      session_duration: info?.duration_minutes ?? 0,
      consultant_id: null,
      consultant_name: info?.consultant_name ?? null,
      available_slot_count: info?.available_slot_count ?? 0,
      instructor_id: null,
      expert_key: info?.expert_key ?? null,
      category_ids: [],
    },
    // Sections now come from the product README (see `readme`); the legacy `info` blocks are no longer read.
    info: [],
    available_slots: [],
  };
}

/**
 * The consultation with this legacy id, its expert, and its two rails (other consultations, and
 * courses/diplomas/packages); null when it doesn't exist. Everything is read from B2C.
 *
 * The expert's photo, bio, other consultations and programs come from their profile (`expert_key`).
 * Everything but the consultation itself fails independently and is simply left off the page. A failed
 * consultation request throws, so ISR keeps serving the last good page.
 */
export const getConsultationDetail = cache(async (id: number): Promise<ConsultationDetailData | null> => {
  const options = cachedRead(CONSULTATION_REVALIDATE_SECONDS, [tagOf(id)]);
  let product: CatalogProductResponse;
  try {
    product = await getCatalogProduct(tagOf(id), options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
  if (product.product.product_type !== "consultation") {
    return null;
  }

  let detail = toLegacyConsultation(id, product);
  const expertKey = detail.consultation.expert_key;
  const [expert, consultations, catalog, instructors, booking] = await Promise.allSettled([
    expertKey ? getCatalogExpert(expertKey, cachedRead(CONSULTATION_REVALIDATE_SECONDS, [tagOf(id), expertCacheTag(expertKey)])) : null,
    getConsultationIndex(),
    getCatalogIndex(),
    // Shared across every product page, like the catalog index.
    getInstructorNames(cachedRead(CONSULTATION_REVALIDATE_SECONDS, ["catalog-index"])),
    // The bookable session length lives in the booking backend (the expert sets it there).
    getAvailability(consultationProductRef(id), undefined, options),
  ]);

  // Prefer the booking backend's session length: the expert can change it there.
  const sessionMinutes = valueOf(booking, `consultation ${id} availability`)?.session_minutes;
  if (sessionMinutes && sessionMinutes > 0) {
    detail = { ...detail, consultation: { ...detail.consultation, session_duration: sessionMinutes } };
  }

  const expertDetail = valueOf(expert, `consultation ${id} expert`);
  const legacyExpert = expertDetail ? toLegacyShape(expertDetail) : null;
  const data = mapConsultationDetailData({
    detail,
    expert: legacyExpert,
    consultations: valueOf(consultations, "consultation index"),
    related: legacyExpert?.related ?? null,
    recommendations: null,
    catalog: valueOf(catalog, "catalog index"),
    instructors: valueOf(instructors, "instructor names"),
  });
  return { ...data, consultation: { ...data.consultation, readme: product.readme?.trim() || null } };
});
