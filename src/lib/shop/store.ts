"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ShopItemKind } from "./contract";

export type { ShopItemKind } from "./contract";

export type ShopItem = {
  /** Stable key: `${kind}:${id}` (legacy ids collide across kinds). */
  key: string;
  kind: ShopItemKind;
  /** Legacy id; the catalog slug is `${kind}-${id}`. */
  id: number;
  title: string;
  href: string;
  image: string | null;
  /** Price when the item was saved. Display fallback only: pages re-price from the catalog. */
  priceAmount: number | null;
};

export type WishlistEntry = ShopItem & {
  /** Catalog product UUID, resolved lazily from the slug when syncing to the account. */
  productId?: string;
  /** True once the account wishlist (`/me/wishlist`) holds this item. */
  synced?: boolean;
  /** Epoch ms; orders the wishlist page. */
  addedAt: number;
};

export type CartLine = ShopItem & {
  addedAt: number;
  /** Catalog product UUID, resolved from the slug when the line reaches the account cart. */
  productId?: string;
  /** The account cart's line id (`b2c.cart_items`); set once the line is on the account. */
  cartItemId?: string;
};

type PersistedShop = {
  cart: CartLine[];
  wishlist: WishlistEntry[];
};

type ShopState = PersistedShop & {
  /** Drives the "sign in to pay" dialog on the cart page. Not persisted. */
  authGateOpen: boolean;
  /** Items that could not move to the account cart at sign-in, ready to show. Not persisted. */
  cartNotice: string | null;
  /** Bumped whenever the account cart was changed outside the cart page's queries. Not persisted. */
  accountCartRevision: number;

  addToWishlist: (item: ShopItem) => void;
  removeFromWishlist: (key: string) => void;
  /** Puts a removed entry back where it was (undo). */
  restoreWishlistEntry: (entry: WishlistEntry, index: number) => void;
  /** Adds account wishlist items this browser doesn't hold yet. */
  mergeWishlist: (entries: WishlistEntry[]) => void;
  markWishlistSynced: (key: string, productId: string) => void;
  setWishlistProductId: (key: string, productId: string) => void;

  addToCart: (item: ShopItem) => void;
  removeFromCart: (key: string) => void;
  restoreCartLine: (line: CartLine, index: number) => void;
  /** Signed in: the account cart is the truth, and this mirror is replaced by it. */
  replaceCart: (lines: CartLine[]) => void;
  setCartLineAccount: (key: string, productId: string, cartItemId?: string) => void;
  clearCart: () => void;
  setCartNotice: (notice: string | null) => void;
  bumpAccountCart: () => void;

  openAuthGate: () => void;
  closeAuthGate: () => void;
};

const has = (list: { key: string }[], key: string) => list.some((entry) => entry.key === key);

function insertAt<T>(list: T[], item: T, index: number): T[] {
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

/** Picks the saved fields of a shop item, so extra props on the caller's object never reach storage. */
function toShopItem(item: ShopItem): ShopItem {
  return {
    key: item.key,
    kind: item.kind,
    id: item.id,
    title: item.title,
    href: item.href,
    image: item.image,
    priceAmount: item.priceAmount,
  };
}

type PersistedV2 = {
  cart?: ShopItem[];
  wishlist?: (ShopItem & { productId?: string; synced?: boolean })[];
  pendingCart?: ShopItem | null;
};

type PersistedV3 = {
  cart?: (CartLine & { addons?: unknown })[];
  wishlist?: WishlistEntry[];
};

/**
 * v1/v2 → v3: v2 kept a guest's cart item aside (`pendingCart`) until they signed in; guests now
 * add to the cart directly, so that item simply joins the cart.
 * v3 → v4: the mock checkout's coupon, payment method, order and per-line add-ons are gone; payment
 * happens on Stripe, and orders live on the account.
 */
function migrate(persisted: unknown, version: number): PersistedShop {
  if (version >= 4) return persisted as PersistedShop;
  if (version === 3) {
    const old = (persisted ?? {}) as PersistedV3;
    return {
      cart: (old.cart ?? []).map((line) => {
        const kept: CartLine & { addons?: unknown } = { ...line };
        delete kept.addons;
        return kept;
      }),
      wishlist: old.wishlist ?? [],
    };
  }
  const old = (persisted ?? {}) as PersistedV2;
  const now = Date.now();
  const cartItems = [...(old.cart ?? [])];
  if (old.pendingCart && !has(cartItems, old.pendingCart.key)) cartItems.push(old.pendingCart);
  return {
    // Older entries first: the stored order is the order they were added in.
    cart: cartItems.map((item, index) => ({ ...item, addedAt: now - (cartItems.length - index) })),
    wishlist: (old.wishlist ?? []).map((entry, index, list) => ({ ...entry, addedAt: now - (list.length - index) })),
  };
}

/**
 * Guest-first shop state, persisted in localStorage (product references only — never credentials).
 * - Wishlist: anyone can save; entries sync to the account on sign-in (see `wishlist-sync.ts`).
 * - Cart: guests fill it here. On sign-in it is merged into the account cart, and from then on this
 *   is only a mirror of the account cart (for the header count and artwork); see `cart-sync.ts`.
 * Prices here are snapshots for display before the catalog answers; totals always come from the quote.
 */
export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      authGateOpen: false,
      cartNotice: null,
      accountCartRevision: 0,

      addToWishlist: (item) =>
        set((state) =>
          has(state.wishlist, item.key)
            ? state
            : { wishlist: [...state.wishlist, { ...toShopItem(item), addedAt: Date.now() }] },
        ),
      removeFromWishlist: (key) => set((state) => ({ wishlist: state.wishlist.filter((entry) => entry.key !== key) })),
      restoreWishlistEntry: (entry, index) =>
        set((state) => (has(state.wishlist, entry.key) ? state : { wishlist: insertAt(state.wishlist, entry, index) })),
      mergeWishlist: (entries) =>
        set((state) => {
          const added = entries.filter((entry) => !has(state.wishlist, entry.key));
          return added.length === 0 ? state : { wishlist: [...state.wishlist, ...added] };
        }),
      markWishlistSynced: (key, productId) =>
        set((state) => ({
          wishlist: state.wishlist.map((entry) => (entry.key === key ? { ...entry, productId, synced: true } : entry)),
        })),
      setWishlistProductId: (key, productId) =>
        set((state) => ({
          wishlist: state.wishlist.map((entry) => (entry.key === key ? { ...entry, productId } : entry)),
        })),

      addToCart: (item) =>
        set((state) =>
          has(state.cart, item.key)
            ? state
            : { cart: [...state.cart, { ...toShopItem(item), addedAt: Date.now() }] },
        ),
      removeFromCart: (key) => set((state) => ({ cart: state.cart.filter((entry) => entry.key !== key) })),
      restoreCartLine: (line, index) =>
        set((state) => (has(state.cart, line.key) ? state : { cart: insertAt(state.cart, line, index) })),
      replaceCart: (cart) => set({ cart }),
      setCartLineAccount: (key, productId, cartItemId) =>
        set((state) => ({
          cart: state.cart.map((line) =>
            line.key === key ? { ...line, productId, cartItemId: cartItemId ?? line.cartItemId } : line,
          ),
        })),
      clearCart: () => set({ cart: [] }),
      setCartNotice: (cartNotice) => set({ cartNotice }),
      bumpAccountCart: () => set((state) => ({ accountCartRevision: state.accountCartRevision + 1 })),

      openAuthGate: () => set({ authGateOpen: true }),
      closeAuthGate: () => set({ authGateOpen: false }),
    }),
    {
      name: "ma-shop",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, wishlist }): PersistedShop => ({ cart, wishlist }),
      migrate,
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

const subscribeHydration = (onChange: () => void) => useShopStore.persist.onFinishHydration(onChange);
const readHydrated = () => useShopStore.persist.hasHydrated();
const notHydrated = () => false;

/**
 * Rehydrates the store and reports whether the saved cart and wishlist are loaded. Pages that list
 * them show a skeleton until then, instead of flashing their empty state.
 */
export function useShopHydrated(): boolean {
  useShopHydration();
  return useSyncExternalStore(subscribeHydration, readHydrated, notHydrated);
}
