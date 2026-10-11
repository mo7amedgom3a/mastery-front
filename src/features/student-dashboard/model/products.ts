import { KIND_ORDER, kindLabel, kindPluralLabel } from "@/lib/shop/labels";
import type { ShopItemKind } from "@/lib/shop/store";

const TYPE_LABELS: Record<string, string> = { ...kindLabel, bundle: "حزمة" } satisfies Partial<
  Record<ShopItemKind | "bundle", string>
>;

/** Singular label of a catalog product type ("دورة"); the raw code when unknown. */
export function productTypeLabel(productType: string): string {
  return TYPE_LABELS[productType] ?? productType;
}

const TYPE_PLURAL_LABELS: Record<string, string> = { ...kindPluralLabel, bundle: "الحزم" };

/** Plural label of a catalog product type, for filter chips ("الدورات"). */
export function productTypePluralLabel(productType: string): string {
  return TYPE_PLURAL_LABELS[productType] ?? productTypeLabel(productType);
}

const TYPE_ORDER: readonly string[] = [...KIND_ORDER, "bundle"];

export type TypeCount = { type: string; count: number };

/** How many items of each product type, in catalog order (unknown types last; items without one are left out). */
export function countByType<T>(items: readonly T[], typeOf: (item: T) => string): TypeCount[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const type = typeOf(item);
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const rank = (type: string) => (TYPE_ORDER.includes(type) ? TYPE_ORDER.indexOf(type) : TYPE_ORDER.length);
  return [...counts]
    .map(([type, count]) => ({ type, count }))
    .toSorted((a, b) => rank(a.type) - rank(b.type));
}

/** Image hosts `next.config.ts` allows; anything else would make `next/image` throw. */
const IMAGE_HOSTS = new Set(["live.emasteryacademy.com", "public.emasteryacademy.com"]);

export function safeImage(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return IMAGE_HOSTS.has(new URL(url).hostname) ? url : null;
  } catch {
    return null;
  }
}

/** API prices are decimal strings ("129.00"); null when missing or not a number. */
export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
