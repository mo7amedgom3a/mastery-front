import { formatCount } from "@/lib/format";

import type { PackageDetailVM } from "./types";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const DIPLOMA_FORMS = { one: "دبلوم واحد", two: "دبلومان", few: "دبلومات", many: "دبلوماً" };
const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };

export type PackageFactKey = "items" | "duration" | "lessons" | "access";
export type PackageFact = { key: PackageFactKey; label: string };

/** "6 دورات ودبلوم واحد": what the package holds, by kind. */
export function itemsLabel(product: Pick<PackageDetailVM, "courseCount" | "diplomaCount">): string | null {
  const parts = [
    product.courseCount > 0 ? formatCount(product.courseCount, COURSE_FORMS) : null,
    product.diplomaCount > 0 ? formatCount(product.diplomaCount, DIPLOMA_FORMS) : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" و") : null;
}

/** Headline facts shown in the hero and on the share card, in display order. */
export function packageFacts(product: PackageDetailVM): PackageFact[] {
  const facts: PackageFact[] = [];
  const items = itemsLabel(product);
  if (items) facts.push({ key: "items", label: items });
  if (product.duration) facts.push({ key: "duration", label: product.duration });
  if (product.lessonCount > 0) facts.push({ key: "lessons", label: formatCount(product.lessonCount, LESSON_FORMS) });
  // Every purchase includes a year of access (see the FAQ and the purchase card).
  facts.push({ key: "access", label: "وصول لمدة عام" });
  return facts;
}
