"use client";

import { useAuthStore } from "@/lib/auth/store";

import { useShopStore, type ShopItem } from "./store";
import { pushWishlistEntry, removeWishlistEntry } from "./wishlist-sync";

/** Resolves whether there's a session, checking with the API once if we don't know yet. */
export async function ensureAuthStatus(): Promise<boolean> {
  const { status, bootstrap } = useAuthStore.getState();
  if (status === "authenticated") return true;
  if (status === "unauthenticated") return false;
  try {
    return (await bootstrap()) !== null;
  } catch {
    return false;
  }
}

/** Saves an item; signed-in visitors also get it on their account. No-op when already saved. */
export function saveToWishlist(item: ShopItem): void {
  const shop = useShopStore.getState();
  if (shop.wishlist.some((entry) => entry.key === item.key)) return;
  shop.addToWishlist(item);
  if (useAuthStore.getState().status === "authenticated") {
    const entry = useShopStore.getState().wishlist.find((saved) => saved.key === item.key);
    if (entry) void pushWishlistEntry(entry);
  }
}

/** Removes a saved item, from the account too when it was synced there. */
export function removeFromWishlist(key: string): void {
  const shop = useShopStore.getState();
  const existing = shop.wishlist.find((entry) => entry.key === key);
  if (!existing) return;
  shop.removeFromWishlist(key);
  if (useAuthStore.getState().status === "authenticated") void removeWishlistEntry(existing);
}

/** Wishlist and cart are both open to guests; signing in is asked for at payment. */
export function useShopActions() {
  const toggleWishlist = (item: ShopItem): boolean => {
    if (useShopStore.getState().wishlist.some((entry) => entry.key === item.key)) {
      removeFromWishlist(item.key);
      return false;
    }
    saveToWishlist(item);
    return true;
  };

  const toggleCart = (item: ShopItem): boolean => {
    const shop = useShopStore.getState();
    if (shop.cart.some((entry) => entry.key === item.key)) {
      shop.removeFromCart(item.key);
      return false;
    }
    shop.addToCart(item);
    return true;
  };

  return { toggleWishlist, toggleCart };
}
