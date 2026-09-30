"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { rehydrateShop } from "@/lib/shop/store";
import { syncGuestWishlist } from "@/lib/shop/wishlist-sync";

function onIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1500);
  return () => clearTimeout(id);
}

/**
 * Mounted once. Connects the guest shop state to the account:
 * 1. Restores the saved wishlist/cart, then (when the browser is idle) asks the API whether
 *    there's already a session.
 * 2. Whenever the session becomes authenticated (login, 2FA, register → login, refresh), pushes
 *    guest wishlist items to `/me/wishlist`.
 * The cart needs no bridge: guests fill it freely, and payment asks for the session (cart page).
 */
export function ShopAuthBridge() {
  useEffect(() => {
    const onAuthenticated = async () => {
      await rehydrateShop();
      await syncGuestWishlist();
    };

    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.status === "authenticated" && previous.status !== "authenticated") void onAuthenticated();
    });

    const cancelIdle = onIdle(() => {
      void rehydrateShop().then(() => {
        const { status, bootstrap } = useAuthStore.getState();
        if (status === "idle") bootstrap().catch(() => undefined);
        else if (status === "authenticated") void onAuthenticated();
      });
    });

    return () => {
      unsubscribe();
      cancelIdle();
    };
  }, []);

  return null;
}
