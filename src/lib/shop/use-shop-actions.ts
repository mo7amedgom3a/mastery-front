"use client";

import { useAuthStore } from "@/lib/auth/store";
import { trackCart, trackWishlist } from "@/lib/observability/behavior";

import { dropCartLine, pushCartLine } from "./cart-sync";
import { useShopStore, type CartLine, type ShopItem } from "./store";
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
  trackWishlist(item, true);
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
  trackWishlist(existing, false);
  if (useAuthStore.getState().status === "authenticated") void removeWishlistEntry(existing);
}

/**
 * Adds an item to the cart; signed in, to the account cart too. No-op when already there.
 * `track: false` when the caller reports the add itself (bulk adds).
 */
export function addToCart(item: ShopItem, { track = true }: { track?: boolean } = {}): void {
  const shop = useShopStore.getState();
  if (shop.cart.some((entry) => entry.key === item.key)) return;
  shop.addToCart(item);
  if (track) trackCart(item, true);
  if (useAuthStore.getState().status === "authenticated") {
    const line = useShopStore.getState().cart.find((entry) => entry.key === item.key);
    if (line) void pushCartLine(line);
  }
}

/** Removes a cart line; signed in, from the account cart too. */
export function removeFromCart(line: CartLine): void {
  useShopStore.getState().removeFromCart(line.key);
  trackCart(line, false);
  if (useAuthStore.getState().status === "authenticated") void dropCartLine(line);
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
    const existing = useShopStore.getState().cart.find((entry) => entry.key === item.key);
    if (existing) {
      removeFromCart(existing);
      return false;
    }
    addToCart(item);
    return true;
  };

  return { toggleWishlist, toggleCart };
}
