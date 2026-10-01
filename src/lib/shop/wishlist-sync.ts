"use client";

import { getCatalogProduct } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { addWishlistItem, removeWishlistItem } from "@/lib/api/customers";

import { useShopStore, type WishlistEntry } from "./store";

/**
 * Landing cards carry legacy ids; the account wishlist is keyed by catalog `product_id` (UUID).
 * The catalog slug for a legacy item is `${kind}-${legacyId}` (e.g. `course-4`).
 */
async function resolveProductId(entry: WishlistEntry): Promise<string> {
  if (entry.productId) return entry.productId;
  const detail = await getCatalogProduct(`${entry.kind}-${entry.id}`, { sameOrigin: true });
  const productId = detail.product.product_id;
  useShopStore.getState().setWishlistProductId(entry.key, productId);
  return productId;
}

/** Adds one entry to the signed-in account's wishlist. The API is idempotent for existing items. */
export async function pushWishlistEntry(entry: WishlistEntry): Promise<boolean> {
  try {
    const productId = await resolveProductId(entry);
    await addWishlistItem({ product_id: productId });
    useShopStore.getState().markWishlistSynced(entry.key, productId);
    return true;
  } catch (error) {
    // 404: not a published catalog product yet — keep it locally and retry on the next sign-in.
    // 401: session expired — same. Anything else is logged for visibility.
    if (!(error instanceof ApiError && (error.status === 404 || error.status === 401))) {
      console.error("[wishlist] sync failed", entry.key, error);
    }
    return false;
  }
}

export async function removeWishlistEntry(entry: WishlistEntry): Promise<void> {
  if (!entry.synced || !entry.productId) return;
  try {
    await removeWishlistItem(entry.productId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      console.error("[wishlist] remove failed", entry.key, error);
    }
  }
}

let syncing: Promise<void> | null = null;

/** Pushes every not-yet-synced local wishlist entry to the account (run after login/register). */
export function syncGuestWishlist(): Promise<void> {
  syncing ??= (async () => {
    try {
      const pending = useShopStore.getState().wishlist.filter((entry) => !entry.synced);
      // Small batches keep the burst polite while still finishing quickly.
      for (let index = 0; index < pending.length; index += 4) {
        await Promise.all(pending.slice(index, index + 4).map(pushWishlistEntry));
      }
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}
