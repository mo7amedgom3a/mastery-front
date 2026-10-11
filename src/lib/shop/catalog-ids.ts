"use client";

import { getCatalogProduct } from "@/lib/api/catalog";

import type { ShopItemKind } from "./contract";
import { catalogSlug } from "./product-links";

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
