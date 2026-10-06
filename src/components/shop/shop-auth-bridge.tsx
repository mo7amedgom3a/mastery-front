"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { syncFaroIdentity } from "@/lib/observability/faro";
import { identifyCustomer } from "@/lib/observability/posthog";
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

    // Signed-in visitors are keyed by their opaque customer id (no PII). In Faro, guests keep the
    // random client fingerprint; in PostHog they stay anonymous until they sign in, and signing out
    // resets to a new anonymous id. Only settled states count: `idle`/`loading` say nothing yet.
    const syncIdentity = () => {
      const { status, user } = useAuthStore.getState();
      const customerId = status === "authenticated" && user ? user.customer_id : null;
      syncFaroIdentity(customerId);
      if (status === "authenticated" || status === "unauthenticated") identifyCustomer(customerId);
    };

    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      syncIdentity();
      if (state.status === "authenticated" && previous.status !== "authenticated") void onAuthenticated();
    });

    syncIdentity();

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
