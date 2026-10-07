"use client";

import { getCatalogProduct } from "@/lib/api/catalog";
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

export function shopItemHref(kind: ShopItemKind, id: number): string {
  if (kind === "diploma") return routes.diploma(id);
  if (kind === "package") return routes.package(id);
  if (kind === "consultation") return routes.consultation(id);
  return routes.course(id);
}

const productIds = new Map<string, Promise<string>>();

/** Catalog product UUID for a legacy item, read once per page load. Rejects with the API error (404: not in the catalog). */
export function resolveCatalogProductId(item: { kind: ShopItemKind; id: number }): Promise<string> {
  const slug = catalogSlug(item);
  let pending = productIds.get(slug);
  if (!pending) {
    pending = getCatalogProduct(slug, { sameOrigin: true }).then((detail) => detail.product.product_id);
    // A failure is not remembered: the next attempt asks again.
    pending.catch(() => productIds.delete(slug));
    productIds.set(slug, pending);
  }
  return pending;
}
