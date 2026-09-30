"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AddonCode, Order, PaymentMethodId, ShopItemKind } from "./contract";

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
  /** Paid extras chosen for this item (see the quote for what each costs). */
  addons: AddonCode[];
  addedAt: number;
};

type PersistedShop = {
  cart: CartLine[];
  wishlist: WishlistEntry[];
  coupon: string | null;
  paymentMethod: PaymentMethodId | null;
  order: Order | null;
};

type ShopState = PersistedShop & {
  /** Drives the "sign in to pay" dialog on the cart page. Not persisted. */
  authGateOpen: boolean;
  /** MOCK: the visitor chose to continue as the test customer (mock checkout only). Not persisted. */
  mockCustomer: boolean;

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
  toggleCartAddon: (key: string, addon: AddonCode) => void;
  clearCart: () => void;

  setCoupon: (code: string | null) => void;
  setPaymentMethod: (method: PaymentMethodId | null) => void;
  setOrder: (order: Order | null) => void;

  openAuthGate: () => void;
  closeAuthGate: () => void;
  setMockCustomer: (value: boolean) => void;
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

/**
 * v1/v2 → v3. v2 kept a guest's cart item aside (`pendingCart`) until they signed in; guests now
 * add to the cart directly, so that item simply joins the cart. Lines gain add-ons and a date.
 */
function migrate(persisted: unknown, version: number): PersistedShop {
  if (version >= 3) return persisted as PersistedShop;
  const old = (persisted ?? {}) as PersistedV2;
  const now = Date.now();
  const cartItems = [...(old.cart ?? [])];
  if (old.pendingCart && !has(cartItems, old.pendingCart.key)) cartItems.push(old.pendingCart);
  return {
    // Older entries first: the stored order is the order they were added in.
    cart: cartItems.map((item, index) => ({ ...item, addons: [], addedAt: now - (cartItems.length - index) })),
    wishlist: (old.wishlist ?? []).map((entry, index, list) => ({ ...entry, addedAt: now - (list.length - index) })),
    coupon: null,
    paymentMethod: null,
    order: null,
  };
}

/**
 * Guest-first shop state, persisted in localStorage (product references only — never credentials).
 * - Wishlist: anyone can save; entries sync to the account on sign-in (see `wishlist-sync.ts`).
 * - Cart: anyone can fill it; signing in is asked for at payment (see the cart page).
 * Prices here are snapshots for display before the catalog answers; totals always come from the quote.
 * TODO(api): replace the local cart with the B2C cart API once it exists.
 */
export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      coupon: null,
      paymentMethod: null,
      order: null,
      authGateOpen: false,
      mockCustomer: false,

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
            : { cart: [...state.cart, { ...toShopItem(item), addons: [], addedAt: Date.now() }] },
        ),
      removeFromCart: (key) => set((state) => ({ cart: state.cart.filter((entry) => entry.key !== key) })),
      restoreCartLine: (line, index) =>
        set((state) => (has(state.cart, line.key) ? state : { cart: insertAt(state.cart, line, index) })),
      toggleCartAddon: (key, addon) =>
        set((state) => ({
          cart: state.cart.map((line) =>
            line.key !== key
              ? line
              : {
                  ...line,
                  addons: line.addons.includes(addon)
                    ? line.addons.filter((code) => code !== addon)
                    : [...line.addons, addon],
                },
          ),
        })),
      clearCart: () => set({ cart: [], coupon: null }),

      setCoupon: (coupon) => set({ coupon }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setOrder: (order) => set({ order }),

      openAuthGate: () => set({ authGateOpen: true }),
      closeAuthGate: () => set({ authGateOpen: false }),
      setMockCustomer: (mockCustomer) => set({ mockCustomer }),
    }),
    {
      name: "ma-shop",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, wishlist, coupon, paymentMethod, order }): PersistedShop => ({
        cart,
        wishlist,
        coupon,
        paymentMethod,
        order,
      }),
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
