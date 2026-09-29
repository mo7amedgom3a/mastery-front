"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ShopItemKind = "course" | "diploma" | "package" | "consultation";

export type ShopItem = {
  /** Stable key: `${kind}:${id}` (legacy ids collide across kinds). */
  key: string;
  kind: ShopItemKind;
  /** Legacy id; the catalog slug is `${kind}-${id}`. */
  id: number;
  title: string;
  href: string;
  image: string | null;
  priceAmount: number | null;
};

export type WishlistEntry = ShopItem & {
  /** Catalog product UUID, resolved lazily from the slug when syncing to the account. */
  productId?: string;
  /** True once the account wishlist (`/me/wishlist`) holds this item. */
  synced?: boolean;
};

type ShopState = {
  cart: ShopItem[];
  wishlist: WishlistEntry[];
  /** Item a guest tried to add to the cart; added automatically once they sign in. */
  pendingCart: ShopItem | null;
  /** Drives the "sign in to continue" dialog. Not persisted. */
  authPrompt: ShopItem | null;

  addToWishlist: (item: ShopItem) => void;
  removeFromWishlist: (key: string) => void;
  markWishlistSynced: (key: string, productId: string) => void;
  setWishlistProductId: (key: string, productId: string) => void;

  addToCart: (item: ShopItem) => void;
  removeFromCart: (key: string) => void;

  requestAuthForCart: (item: ShopItem) => void;
  closeAuthPrompt: () => void;
  /** Moves `pendingCart` into the cart (after sign-in). */
  flushPendingCart: () => void;
};

const has = (list: { key: string }[], key: string) => list.some((entry) => entry.key === key);

/**
 * Guest-first shop state, persisted in localStorage (product references only — never credentials).
 * - Wishlist: anyone can save; entries sync to the account on sign-in (see `wishlist-sync.ts`).
 * - Cart: requires an account; guests get a sign-in prompt and the item waits in `pendingCart`.
 * TODO(api): replace the local cart with the B2C cart API once it exists.
 */
export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      pendingCart: null,
      authPrompt: null,

      addToWishlist: (item) =>
        set((state) => (has(state.wishlist, item.key) ? state : { wishlist: [...state.wishlist, { ...item }] })),
      removeFromWishlist: (key) => set((state) => ({ wishlist: state.wishlist.filter((entry) => entry.key !== key) })),
      markWishlistSynced: (key, productId) =>
        set((state) => ({
          wishlist: state.wishlist.map((entry) => (entry.key === key ? { ...entry, productId, synced: true } : entry)),
        })),
      setWishlistProductId: (key, productId) =>
        set((state) => ({
          wishlist: state.wishlist.map((entry) => (entry.key === key ? { ...entry, productId } : entry)),
        })),

      addToCart: (item) => set((state) => (has(state.cart, item.key) ? state : { cart: [...state.cart, item] })),
      removeFromCart: (key) => set((state) => ({ cart: state.cart.filter((entry) => entry.key !== key) })),

      requestAuthForCart: (item) => set({ pendingCart: item, authPrompt: item }),
      closeAuthPrompt: () => set({ authPrompt: null }),
      flushPendingCart: () =>
        set((state) => {
          const item = state.pendingCart;
          if (!item) return state;
          return { pendingCart: null, cart: has(state.cart, item.key) ? state.cart : [...state.cart, item] };
        }),
    }),
    {
      name: "ma-shop",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, wishlist, pendingCart }) => ({ cart, wishlist, pendingCart }),
      // v1 stored the same shape minus sync fields; nothing to transform.
      migrate: (persisted) => persisted as Pick<ShopState, "cart" | "wishlist" | "pendingCart">,
      // Hydrate after mount: server HTML and the first client render must both see an empty store.
      skipHydration: true,
    },
  ),
);

let hydration: Promise<void> | null = null;

export function rehydrateShop(): Promise<void> {
  hydration ??= Promise.resolve(useShopStore.persist.rehydrate());
  return hydration;
}

/** Call from any component that reads the store; rehydrates once per page load. */
export function useShopHydration(): void {
  useEffect(() => {
    void rehydrateShop();
  }, []);
}
