import { create } from "zustand";

import { ApiError } from "@/lib/api/client";
import {
  getCurrentAuthUser,
  login,
  logout,
  refreshSession,
  register,
  verifyTwoFactor,
  type AuthResponse,
  type CustomerAuthResponse,
  type LoginChallengeResponse,
  type LoginRequest,
  type RegisterRequest,
  type RegisterResponse,
  type TwoFactorCheckRequest,
} from "@/lib/api/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: CustomerAuthResponse | null;
  provider: string | null;
  legacy: Record<string, unknown> | null;
  challenge: LoginChallengeResponse | null;
  error: string | null;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  login: (payload: LoginRequest) => Promise<LoginChallengeResponse>;
  verifyTwoFactor: (payload: TwoFactorCheckRequest) => Promise<AuthResponse>;
  bootstrap: () => Promise<CustomerAuthResponse | null>;
  refresh: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  setAuthenticated: (response: AuthResponse) => void;
  setUnauthenticated: (error?: string | null) => void;
};

const initialSnapshot = {
  status: "idle" as AuthStatus,
  user: null,
  provider: null,
  legacy: null,
  challenge: null,
  error: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialSnapshot,

  register: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const response = await register(payload);
      set({ status: "unauthenticated", error: null });
      return response;
    } catch (error) {
      setAuthError(set, error);
      throw error;
    }
  },

  login: async (payload) => {
    set({ status: "loading", challenge: null, error: null });
    try {
      const challenge = await login(payload);
      set({ status: "unauthenticated", challenge, error: null });
      return challenge;
    } catch (error) {
      setAuthError(set, error);
      throw error;
    }
  },

  verifyTwoFactor: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const response = await verifyTwoFactor(payload);
      get().setAuthenticated(response);
      return response;
    } catch (error) {
      setAuthError(set, error);
      throw error;
    }
  },

  bootstrap: async () => {
    set({ status: "loading", error: null });
    try {
      const user = await getCurrentAuthUser();
      set({
        status: "authenticated",
        user,
        provider: null,
        legacy: null,
        challenge: null,
        error: null,
      });
      return user;
    } catch (error) {
      if (isUnauthorized(error)) {
        const refreshed = await get().refresh();
        return refreshed?.customer ?? null;
      }
      setAuthError(set, error);
      throw error;
    }
  },

  refresh: async () => {
    set({ status: "loading", error: null });
    try {
      const response = await refreshSession();
      get().setAuthenticated(response);
      return response;
    } catch (error) {
      if (isUnauthorized(error)) {
        get().setUnauthenticated(null);
        return null;
      }
      setAuthError(set, error);
      throw error;
    }
  },

  logout: async () => {
    set({ status: "loading", error: null });
    try {
      await logout();
    } finally {
      get().setUnauthenticated(null);
    }
  },

  setAuthenticated: (response) => {
    set({
      status: "authenticated",
      user: response.customer,
      provider: response.provider,
      legacy: response.legacy ?? null,
      challenge: null,
      error: null,
    });
  },

  setUnauthenticated: (error = null) => {
    set({
      ...initialSnapshot,
      status: "unauthenticated",
      error,
    });
  },
}));

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Authentication failed";
}

function setAuthError(
  set: (partial: Partial<AuthState>) => void,
  error: unknown,
): void {
  set({
    status: "unauthenticated",
    user: null,
    provider: null,
    legacy: null,
    challenge: null,
    error: getAuthErrorMessage(error),
  });
}
