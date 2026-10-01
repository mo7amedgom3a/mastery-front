import { create } from "zustand";

import { getSession, onSessionLost, refreshOnce, signOut, verifyLoginCode } from "./client";
import type { AuthCustomer } from "./contract";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: AuthCustomer | null;
  /** Asks the server who is signed in, renewing the session if it can. Null: nobody. */
  bootstrap: () => Promise<AuthCustomer | null>;
  refresh: () => Promise<AuthCustomer | null>;
  /** Finishes a sign-in with the emailed code. */
  verifyCode: (code: string) => Promise<AuthCustomer>;
  logout: () => Promise<void>;
  setAuthenticated: (user: AuthCustomer) => void;
  setUnauthenticated: () => void;
};

type AuthMessage = "signed-in" | "signed-out";

/** Tells this browser's other tabs when one of them signs in or out. */
const channel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("mastery-auth") : null;

function announce(message: AuthMessage): void {
  channel?.postMessage(message);
}

let bootstrapping: Promise<AuthCustomer | null> | null = null;

/**
 * Who is signed in, for the UI. It holds the customer's profile only: the tokens live in httpOnly
 * cookies that the `/api/auth/*` route handlers manage.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  user: null,

  bootstrap: () => {
    bootstrapping ??= (async () => {
      // A session already on screen stays there while it is re-checked.
      if (get().status !== "authenticated") set({ status: "loading" });
      try {
        const session = await getSession();
        const user = session.customer ?? (session.refreshable ? await refreshOnce() : null);
        if (user) get().setAuthenticated(user);
        else get().setUnauthenticated();
        return user;
      } catch (error) {
        get().setUnauthenticated();
        throw error;
      } finally {
        bootstrapping = null;
      }
    })();
    return bootstrapping;
  },

  refresh: async () => {
    // A refresh that finds no session signs out through `onSessionLost` below.
    const user = await refreshOnce();
    if (user) get().setAuthenticated(user);
    return user;
  },

  verifyCode: async (code) => {
    const user = await verifyLoginCode(code);
    get().setAuthenticated(user);
    announce("signed-in");
    return user;
  },

  logout: async () => {
    try {
      await signOut();
    } finally {
      get().setUnauthenticated();
      announce("signed-out");
    }
  },

  setAuthenticated: (user) => set({ status: "authenticated", user }),
  setUnauthenticated: () => set({ status: "unauthenticated", user: null }),
}));

onSessionLost(() => useAuthStore.getState().setUnauthenticated());

channel?.addEventListener("message", (event: MessageEvent<AuthMessage>) => {
  if (event.data === "signed-out") useAuthStore.getState().setUnauthenticated();
  // The other tab's cookies are this tab's too: read the session they now describe.
  else if (event.data === "signed-in") useAuthStore.getState().bootstrap().catch(() => undefined);
});
