import { formatCount } from "@/lib/format";

import type { ProductDetailVM } from "./types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };
const UNIT_FORMS = { one: "وحدة واحدة", two: "وحدتان", few: "وحدات", many: "وحدة" };

export type FactKey = "duration" | "units" | "lessons" | "access";
export type ProductFact = { key: FactKey; label: string };

/** Headline facts shown in the hero and on the share card, in display order. */
export function productFacts(product: ProductDetailVM): ProductFact[] {
  const facts: ProductFact[] = [];
  if (product.duration) facts.push({ key: "duration", label: product.duration });
  if (product.curriculum.length > 1) {
    facts.push({ key: "units", label: formatCount(product.curriculum.length, UNIT_FORMS) });
  }
  if (product.lessonCount > 0) facts.push({ key: "lessons", label: formatCount(product.lessonCount, LESSON_FORMS) });
  // Every purchase includes a year of access (see the FAQ and the purchase card).
  facts.push({ key: "access", label: "وصول لمدة عام" });
  return facts;
}
