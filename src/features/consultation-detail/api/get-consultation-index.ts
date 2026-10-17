import "server-only";

import { cache } from "react";

import { cardToConsultationDto, getAllCatalogCards } from "@/lib/api/browse";
import { cachedRead } from "@/lib/api/server-cache";

import type { ConsultationIndex } from "../model/mappers";

const INDEX_REVALIDATE_SECONDS = 300;

/**
 * Every published consultation by id. Recommendation cards carry no artwork or consultant, so they are
 * rebuilt from these records, and the same list finds an expert's other consultations. The same cached
 * request serves every consultation page.
 */
export const getConsultationIndex = cache(async (): Promise<ConsultationIndex> => {
  const cards = await getAllCatalogCards({ product_type: ["consultation"] }, cachedRead(INDEX_REVALIDATE_SECONDS, ["catalog-index"]));
  const index: ConsultationIndex = new Map();
  for (const card of cards) {
    const dto = cardToConsultationDto(card);
    if (dto) index.set(dto.id, dto);
  }
  return index;
});
