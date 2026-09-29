import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";
import { searchProducts } from "@/lib/api/search";
import { cleanText } from "@/lib/format";

/** Instructor names by `${kind}:${legacyId}` (kind: course | diploma), e.g. `course:169`. */
export type InstructorNames = Map<string, string[]>;

/** API maximum page size for search. */
const PAGE_SIZE = 100;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 10;
const SLUG = /^(course|diploma)-(\d+)$/;

/**
 * Who teaches each course and diploma. The legacy lists carry no trainer, but the search index
 * does, so card rails look names up here. Pages after the first load in parallel.
 */
export async function getInstructorNames(options: ApiRequestOptions): Promise<InstructorNames> {
  // Relevance order (the default) isn't stable across pages, so some items would repeat and others
  // never appear; newest-first is a total order.
  const page = (offset: number) =>
    searchProducts({ product_type: ["course", "diploma"], sort: "newest", limit: PAGE_SIZE, offset }, options);

  const first = await page(0);
  const pages = Math.min(MAX_PAGES, Math.ceil(first.total / PAGE_SIZE));
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page((i + 1) * PAGE_SIZE)));

  const names: InstructorNames = new Map();
  for (const item of [first, ...rest].flatMap((result) => result.items)) {
    const match = item.slug?.match(SLUG);
    if (!match) continue;
    const list = [...new Set(item.instructors.map((name) => cleanText(name)).filter((name) => !!name))];
    if (list.length > 0) names.set(`${match[1]}:${match[2]}`, list as string[]);
  }
  return names;
}
