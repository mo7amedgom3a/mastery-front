"use client";

import { useEffect } from "react";
import { create } from "zustand";

import { listOwnedProducts } from "@/lib/api/commerce";
import { useAuthStore } from "@/lib/auth/store";

import { catalogSlug } from "./product-links";
import type { ShopItemKind } from "./store";

const NONE: ReadonlySet<string> = new Set();

type OwnedState = {
  /** Whose list `slugs` is; null until it has loaded. */
  customerId: string | null;
  slugs: ReadonlySet<string>;
};

/**
 * Plain zustand rather than React Query: product cards render on the static pages too, which don't
 * mount a QueryClient (see `QueryProvider`).
 */
const useOwnedStore = create<OwnedState>(() => ({ customerId: null, slugs: NONE }));

let loading: { customerId: string; promise: Promise<void> } | null = null;

/** Loads the customer's active products once per page load; every card shares the one request. */
function loadOwnedProducts(customerId: string, force = false): Promise<void> {
  if (!force && useOwnedStore.getState().customerId === customerId) return Promise.resolve();
  if (!force && loading?.customerId === customerId) return loading.promise;
  const promise = listOwnedProducts({ status: "active", limit: 100 })
    .then((page) => {
      // A sign-out or account switch while this was in flight: drop the stale answer.
      if (useAuthStore.getState().user?.customer_id !== customerId) return;
      useOwnedStore.setState({ customerId, slugs: new Set(page.items.map((product) => product.slug)) });
    })
    .catch(() => undefined) // Unknown ownership: the page keeps its purchase buttons.
    .finally(() => {
      if (loading?.promise === promise) loading = null;
    });
  loading = { customerId, promise };
  return promise;
}

/** Re-reads the list, e.g. right after a purchase, so the bought item offers "continue learning". */
export function refreshOwnedProducts(): Promise<void> {
  const customerId = useAuthStore.getState().user?.customer_id;
  return customerId ? loadOwnedProducts(customerId, true) : Promise.resolve();
}

/** Catalog slugs of the products the signed-in customer has active access to. Guests: none, and no request. */
export function useOwnedSlugs(): ReadonlySet<string> {
  const customerId = useAuthStore((state) => (state.status === "authenticated" ? state.user?.customer_id : null));
  const owned = useOwnedStore();

  useEffect(() => {
    if (customerId) void loadOwnedProducts(customerId);
  }, [customerId]);

  // Never show one customer's list to another (or to nobody, after signing out).
  return customerId && owned.customerId === customerId ? owned.slugs : NONE;
}

/** Whether the signed-in customer already has active access to this item. */
export function useIsOwned(item: { kind: ShopItemKind; id: number }): boolean {
  return useOwnedSlugs().has(catalogSlug(item));
}
