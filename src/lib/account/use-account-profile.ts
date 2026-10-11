"use client";

import { useEffect } from "react";
import { create } from "zustand";

import { getMe, type CustomerProfileResponse } from "@/lib/api/customers";
import { useAuthStore } from "@/lib/auth/store";

type AccountState = { profile: CustomerProfileResponse | null };

/**
 * The signed-in customer's profile (name, avatar) for the site chrome. Plain zustand rather than
 * React Query: the header renders on static pages too, which don't mount a QueryClient.
 */
const useAccountStore = create<AccountState>(() => ({ profile: null }));

let loading: { customerId: string; promise: Promise<void> } | null = null;

function loadProfile(customerId: string): Promise<void> {
  if (useAccountStore.getState().profile?.customer_id === customerId) return Promise.resolve();
  if (loading?.customerId === customerId) return loading.promise;
  const promise = getMe()
    .then((profile) => {
      // Signed out or switched accounts meanwhile: keep nothing.
      if (useAuthStore.getState().user?.customer_id === customerId) useAccountStore.setState({ profile });
    })
    .catch(() => undefined)
    .finally(() => {
      if (loading?.promise === promise) loading = null;
    });
  loading = { customerId, promise };
  return promise;
}

/** Puts a fresh profile in place (after an upload or an edit), so the header follows at once. */
export function setAccountProfile(profile: CustomerProfileResponse): void {
  useAccountStore.setState({ profile });
}

/** The signed-in customer's profile; null for guests and until it has loaded. */
export function useAccountProfile(): CustomerProfileResponse | null {
  const customerId = useAuthStore((state) => (state.status === "authenticated" ? state.user?.customer_id : null));
  const profile = useAccountStore((state) => state.profile);

  useEffect(() => {
    if (customerId) void loadProfile(customerId);
  }, [customerId]);

  return customerId && profile?.customer_id === customerId ? profile : null;
}
