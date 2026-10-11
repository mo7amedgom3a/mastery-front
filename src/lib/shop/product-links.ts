import { routes } from "@/config/routes";

import { parseShopKey, type ShopItemKind } from "./contract";

/**
 * Landing cards carry legacy ids; the account (wishlist, cart) is keyed by catalog `product_id`
 * (UUID). The catalog slug for a legacy item is `${kind}-${legacyId}` (e.g. `course-4`).
 */
export function catalogSlug(item: { kind: ShopItemKind; id: number }): string {
  return `${item.kind}-${item.id}`;
}

const SLUG_PATTERN = /^(course|diploma|package|consultation)-([1-9]\d{0,9})$/;

/** The shop key (`course:4`) of a catalog slug (`course-4`); null for products not sold from this site. */
export function shopKeyFromSlug(slug: string): string | null {
  const match = slug.match(SLUG_PATTERN);
  return match && parseShopKey(`${match[1]}:${match[2]}`) ? `${match[1]}:${match[2]}` : null;
}

/**
 * Page of a catalog product by its slug and type (recommendations, owned products). Bundles are
 * addressed by slug; legacy items by their `${kind}-${id}` slug; anything else falls back to search.
 */
export function catalogProductHref(slug: string, productType: string): string {
  if (productType === "bundle") return routes.bundle(slug);
  const key = shopKeyFromSlug(slug);
  const parsed = key ? parseShopKey(key) : null;
  return parsed ? shopItemHref(parsed.kind, parsed.id) : routes.search;
}

export function shopItemHref(kind: ShopItemKind, id: number): string {
  if (kind === "diploma") return routes.diploma(id);
  if (kind === "package") return routes.package(id);
  if (kind === "consultation") return routes.consultation(id);
  return routes.course(id);
}
