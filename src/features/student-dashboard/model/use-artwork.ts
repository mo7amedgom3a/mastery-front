"use client";

import { useQuery } from "@tanstack/react-query";

import { shopQueries } from "@/features/cart/api/shop-client";
import type { ResolvedItem } from "@/lib/shop/contract";
import { shopKeyFromSlug } from "@/lib/shop/product-links";

const NONE: ReadonlyMap<string, ResolvedItem> = new Map();

/**
 * Catalog artwork (image, instructor) for products known by their catalog slug. The B2C catalog
 * has no media for most products yet, so the cards borrow what the shop already resolves for the
 * cart and wishlist. Keyed by slug; bundles and unknown slugs are simply absent.
 */
export function useCatalogArtwork(slugs: readonly string[]): ReadonlyMap<string, ResolvedItem> {
  const keyBySlug = new Map(slugs.flatMap((slug) => {
    const key = shopKeyFromSlug(slug);
    return key ? [[slug, key] as const] : [];
  }));
  const keys = [...new Set(keyBySlug.values())];
  const resolved = useQuery({ ...shopQueries.items(keys), enabled: keys.length > 0, staleTime: 10 * 60_000 });

  if (!resolved.data) return NONE;
  const byKey = new Map(resolved.data.items.map((item) => [item.key, item]));
  return new Map([...keyBySlug].flatMap(([slug, key]) => {
    const item = byKey.get(key);
    return item ? [[slug, item] as const] : [];
  }));
}
