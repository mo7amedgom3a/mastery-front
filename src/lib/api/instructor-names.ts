import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";
import { getLegacyExperts } from "@/lib/api/legacy";
import { searchProducts } from "@/lib/api/search";
import { cleanText, personNameKey } from "@/lib/format";

/** One trainer of a product: their name, and their profile photo when the experts list has one. */
export type InstructorRef = { name: string; avatar: string | null };

/** Instructors by `${kind}:${legacyId}` (kind: course | diploma), e.g. `course:169`, lead first. */
export type InstructorNames = Map<string, InstructorRef[]>;

/** API maximum page size for search and for the experts list. */
const PAGE_SIZE = 100;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 10;
const SLUG = /^(course|diploma)-(\d+)$/;

/** Every page of a paged list: the first, then the rest in parallel. */
async function allPages<T>(page: (offset: number) => Promise<{ items: T[]; total: number }>): Promise<T[]> {
  const first = await page(0);
  const pages = Math.min(MAX_PAGES, Math.ceil(first.total / PAGE_SIZE));
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page((i + 1) * PAGE_SIZE)));
  return [first, ...rest].flatMap((result) => result.items);
}

/**
 * Profile photos by person name key (see `personNameKey`). The search index names trainers but has
 * no photos; the experts list has both. Cards without a match simply show no photo, so a failed
 * request here never costs the names.
 */
async function getExpertAvatars(options: ApiRequestOptions): Promise<Map<string, string>> {
  const experts = await allPages((offset) => getLegacyExperts({ limit: PAGE_SIZE, offset }, options)).catch(() => []);
  const avatars = new Map<string, string>();
  for (const expert of experts) {
    const key = personNameKey(expert.name);
    // First profile wins when two share a name.
    if (key && expert.profile_image && !avatars.has(key)) avatars.set(key, expert.profile_image);
  }
  return avatars;
}

/**
 * Who teaches each course and diploma. The legacy lists carry no trainer, but the search index
 * does, so card rails look names up here, with each trainer's photo from the experts list.
 */
export async function getInstructorNames(options: ApiRequestOptions): Promise<InstructorNames> {
  const [items, avatars] = await Promise.all([
    // Relevance order (the default) isn't stable across pages, so some items would repeat and others
    // never appear; newest-first is a total order.
    allPages((offset) =>
      searchProducts({ product_type: ["course", "diploma"], sort: "newest", limit: PAGE_SIZE, offset }, options),
    ),
    getExpertAvatars(options),
  ]);

  const instructors: InstructorNames = new Map();
  for (const item of items) {
    const match = item.slug?.match(SLUG);
    if (!match) continue;
    const names = [...new Set(item.instructors.map((name) => cleanText(name)).filter((name) => name !== null))];
    if (names.length > 0) {
      const refs = names.map((name) => ({ name, avatar: avatars.get(personNameKey(name) ?? "") ?? null }));
      instructors.set(`${match[1]}:${match[2]}`, refs);
    }
  }
  return instructors;
}
