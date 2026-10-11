"use client";

import type { Route } from "next";

import { routes } from "@/config/routes";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Where the wishlist and cart live for this visitor: inside the student dashboard once signed in
 * (so the dashboard navigation stays around them), the public pages for a guest.
 */
export function useShopRoutes(): { wishlist: Route; cart: Route } {
  const signedIn = useAuthStore((state) => state.status === "authenticated");
  return signedIn
    ? { wishlist: routes.studentWishlist, cart: routes.studentCart }
    : { wishlist: routes.wishlist, cart: routes.cart };
}
