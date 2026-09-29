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

/** Wishlist is open to guests; the cart asks guests to sign in first. */
export function useShopActions() {
  const toggleWishlist = (item: ShopItem): boolean => {
    const shop = useShopStore.getState();
    const existing = shop.wishlist.find((entry) => entry.key === item.key);
    const signedIn = useAuthStore.getState().status === "authenticated";

    if (existing) {
      shop.removeFromWishlist(item.key);
      if (signedIn) void removeWishlistEntry(existing);
      return false;
    }
    shop.addToWishlist(item);
    if (signedIn) void pushWishlistEntry({ ...item });
    return true;
  };

  const toggleCart = async (item: ShopItem): Promise<void> => {
    const shop = useShopStore.getState();
    if (shop.cart.some((entry) => entry.key === item.key)) {
      shop.removeFromCart(item.key);
      return;
    }
    if (await ensureAuthStatus()) {
      shop.addToCart(item);
    } else {
      shop.requestAuthForCart(item);
    }
  };

  return { toggleWishlist, toggleCart };
}
