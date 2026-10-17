import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";
import { getAllCatalogCards, parseCardSlug } from "@/lib/api/browse";
import { cleanText } from "@/lib/format";

/** One trainer of a product: their name, and their profile photo when they have one. */
export type InstructorRef = { name: string; avatar: string | null };

/** Instructors by `${kind}:${legacyId}` (kind: course | diploma), e.g. `course:169`. */
export type InstructorNames = Map<string, InstructorRef[]>;

/** Who teaches each published course and diploma, from the B2C card list (`instructor_name` / `instructor_avatar`). */
export async function getInstructorNames(options: ApiRequestOptions): Promise<InstructorNames> {
  const cards = await getAllCatalogCards({ product_type: ["course", "diploma"], sort: "newest" }, options);
  const instructors: InstructorNames = new Map();
  for (const card of cards) {
    const parsed = parseCardSlug(card.slug);
    const name = cleanText(card.instructor_name);
    if (parsed && name) instructors.set(`${parsed.kind}:${parsed.id}`, [{ name, avatar: card.instructor_avatar ?? null }]);
  }
  return instructors;
}
