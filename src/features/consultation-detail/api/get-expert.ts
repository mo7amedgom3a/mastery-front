import "server-only";

import { cache } from "react";

import { getLegacyInstructors } from "@/lib/api/legacy";
import { cachedRead } from "@/lib/api/server-cache";

import { expertNameKey, type InstructorDto } from "../model/mappers";

/** API maximum page size for legacy lists. */
const PAGE_SIZE = 200;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 5;
const INDEX_REVALIDATE_SECONDS = 300;

/** Every instructor by name key (see `expertNameKey`). Shared by every consultation page. */
const getInstructorsByName = cache(async (): Promise<Map<string, InstructorDto>> => {
  const options = cachedRead(INDEX_REVALIDATE_SECONDS, ["catalog-index"]);
  const byName = new Map<string, InstructorDto>();
  let loaded = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await getLegacyInstructors({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }, options);
    loaded += result.items.length;
    for (const dto of result.items) {
      const key = expertNameKey(dto.name);
      // First profile wins when two share a name.
      if (key && !byName.has(key)) byName.set(key, dto);
    }
    if (result.items.length < PAGE_SIZE || loaded >= result.total) break;
  }
  return byName;
});

/**
 * The instructor profile behind a consultant, or null when none carries the same name. The API
 * links the two by nothing else: `consultant_id` belongs to a separate id space.
 */
export async function getExpert(consultantName: string | null | undefined): Promise<InstructorDto | null> {
  const key = expertNameKey(consultantName);
  if (!key) {
    return null;
  }
  return (await getInstructorsByName()).get(key) ?? null;
}
