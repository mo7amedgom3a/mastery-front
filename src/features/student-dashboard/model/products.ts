import type { OwnedProductResponse } from "@/lib/api/commerce";
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
/** The legacy S3 bucket names sit in the path (`/course.emasteryacademy.com/…`). */
const LEGACY_BUCKETS = /^\/(course|curriculum|consultant|category|instructor|trainer|b2blogos)\.emasteryacademy\.com\//;
/** Course Studio covers on the B2C bucket, under `catalog/assets/` (see `next.config.ts`). */
const CATALOG_ASSET_HOSTS = new Set([
  "mastery-b2c-prod-app-844339186365.s3.us-east-1.amazonaws.com",
  "mastery-bucket-1234.s3.us-east-1.amazonaws.com",
]);

export function safeImage(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname === "s3.eu-west-1.amazonaws.com") {
      return LEGACY_BUCKETS.test(parsed.pathname) ? url : null;
    }
    if (CATALOG_ASSET_HOSTS.has(parsed.hostname)) {
      return parsed.pathname.startsWith("/catalog/assets/") ? url : null;
    }
    return IMAGE_HOSTS.has(parsed.hostname) ? url : null;
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

type LearningProduct = Pick<OwnedProductResponse, "title" | "slug" | "product_type" | "access_status" | "progress_pct">;

/**
 * The name a learner sees: the API title unless it is the raw catalog slug, then the shop's resolved
 * title, then the product type. Keeps the dashboard list, hero and progress page consistent.
 */
export function ownedProductTitle(
  product: Pick<OwnedProductResponse, "title" | "slug" | "product_type">,
  fallbackTitle?: string | null,
): string {
  const apiTitle = product.title && product.title !== product.slug ? product.title : null;
  return apiTitle ?? fallbackTitle ?? productTypeLabel(product.product_type);
}

/** Active, not finished and not a consultation: what the home hero and learning list show. */
export function isInProgress(product: LearningProduct): boolean {
  return (
    product.access_status === "active" &&
    product.product_type !== "consultation" &&
    (product.progress_pct == null || product.progress_pct < 100)
  );
}

/**
 * True when the title's first strong character is Latin, so English catalog names can keep the
 * demo's right-aligned LTR treatment without flipping mixed Arabic/English titles.
 */
export function startsWithLatin(text: string): boolean {
  return /^[\s\d\p{P}]*[A-Za-z]/u.test(text);
}
