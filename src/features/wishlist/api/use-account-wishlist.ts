"use client";

import { useEffect } from "react";

import { routes } from "@/config/routes";
import { getWishlistItems, type WishlistItemResponse } from "@/lib/api/customers";
import { useAuthStore } from "@/lib/auth/store";
import { parseShopKey } from "@/lib/shop/contract";
import { useShopStore, type WishlistEntry } from "@/lib/shop/store";

/** API maximum page size. */
const PAGE_SIZE = 100;

/** Catalog slugs are `${kind}-${legacyId}`; items saved from another device arrive this way. */
function toEntry(item: WishlistItemResponse): WishlistEntry | null {
  const parsed = parseShopKey(item.slug.replace("-", ":"));
  if (!parsed) return null;
  const { kind, id } = parsed;
  // Link names aren't known here; detail pages redirect to their full URL, and the catalog
  // lookup on the page replaces this link with the exact one.
  const href =
    kind === "course"
      ? routes.course(id)
      : kind === "diploma"
        ? routes.diploma(id)
        : kind === "package"
          ? routes.package(id)
          : routes.consultation(id);
  const addedAt = Date.parse(item.added_at);
  return {
    key: `${kind}:${id}`,
    kind,
    id,
    title: item.title ?? "",
    href,
    image: item.image ?? null,
    priceAmount: null,
    productId: item.product_id,
    synced: true,
    addedAt: Number.isFinite(addedAt) ? addedAt : Date.now(),
  };
}

/**
 * Once signed in, adds the account's saved items (e.g. from another device) to this browser's
 * wishlist. The other direction — guest items pushed to the account — is `syncGuestWishlist`.
 */
export function useAccountWishlist(ready: boolean): void {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (!ready || status !== "authenticated") return;
    const controller = new AbortController();
    getWishlistItems({ limit: PAGE_SIZE }, { signal: controller.signal })
      .then((page) => {
        const entries = page.items.map(toEntry).filter((entry): entry is WishlistEntry => entry !== null);
        useShopStore.getState().mergeWishlist(entries);
      })
      .catch((error) => {
        // The local list still works; the account copy just isn't merged this time.
        if (!controller.signal.aborted) console.error("[wishlist] account list failed", error);
      });
    return () => controller.abort();
  }, [ready, status]);
}
