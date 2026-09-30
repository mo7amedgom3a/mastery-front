import "server-only";

import { cache } from "react";

import { getLegacyConsultations } from "@/lib/api/legacy";
import { cachedRead } from "@/lib/api/server-cache";

import type { ConsultationIndex } from "../model/mappers";

/** API maximum page size for legacy lists. */
const PAGE_SIZE = 200;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 5;
const INDEX_REVALIDATE_SECONDS = 300;

/**
 * Every consultation by id. Recommendation cards carry no artwork or consultant, so they are
 * rebuilt from these records, and the same list finds an expert's other consultations. The same
 * cached request serves every consultation page.
 */
export const getConsultationIndex = cache(async (): Promise<ConsultationIndex> => {
  const options = cachedRead(INDEX_REVALIDATE_SECONDS, ["catalog-index"]);
  const index: ConsultationIndex = new Map();
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await getLegacyConsultations({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }, options);
    for (const dto of result.items) index.set(dto.id, dto);
    if (result.items.length < PAGE_SIZE || index.size >= result.total) break;
  }
  return index;
});
