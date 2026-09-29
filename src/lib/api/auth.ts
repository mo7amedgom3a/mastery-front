import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";

export type RegisterRequest = {
  email: string;
  password: string;
  repassword: string;
  fullname: string;
  acceptterms: boolean;
  phone?: string | null;
};

export type RegisterResponse = {
  registered: boolean;
  provider: string;
  provider_response: string;
};

export type LoginRequest = {
  loginName: string;
};

export type LoginChallengeResponse = {
  email: string;
  userId: string;
  requires2fa: boolean;
};

export type TwoFactorCheckRequest = {
  email: string;
  userId: string;
  code: string;
};

export type CustomerAuthResponse = {
  customer_id: string;
  email: string;
  status: string;
  full_name?: string | null;
  lms_user_id?: string | null;
  lms_numeric_user_id?: number | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
};

export type AuthResponse = {
  customer: CustomerAuthResponse;
  provider: string;
  tokens: TokenResponse;
  legacy?: Record<string, unknown> | null;
};

export type RefreshRequest = {
  refresh_token?: string | null;
};

export type LogoutRequest = {
  refresh_token?: string | null;
};

const authPaths = {
  register: "/api/v1/auth/register",
  login: "/api/v1/auth/login",
  twoFactorCheck: "/api/v1/auth/2fa/check",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",
  me: "/api/v1/auth/me",
} as const;

type AuthRequestOptions = Omit<ApiRequestOptions, "body" | "credentials">;

function withAuthCookies(options?: AuthRequestOptions): AuthRequestOptions & { credentials: "include" } {
  return {
    ...options,
    credentials: "include",
  };
}

export function register(
  body: RegisterRequest,
  options?: AuthRequestOptions,
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("POST", authPaths.register, {
    ...withAuthCookies(options),
    body,
  });
}

export function login(
  body: LoginRequest,
  options?: AuthRequestOptions,
): Promise<LoginChallengeResponse> {
  return apiRequest<LoginChallengeResponse>("POST", authPaths.login, {
    ...withAuthCookies(options),
    body,
  });
}

export function verifyTwoFactor(
  body: TwoFactorCheckRequest,
  options?: AuthRequestOptions,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("POST", authPaths.twoFactorCheck, {
    ...withAuthCookies(options),
    body,
  });
}

export function refreshSession(
  body: RefreshRequest = {},
  options?: AuthRequestOptions,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("POST", authPaths.refresh, {
    ...withAuthCookies(options),
    body,
  });
}

export function logout(
  body: LogoutRequest = {},
  options?: AuthRequestOptions,
): Promise<void> {
  return apiRequest<void>("POST", authPaths.logout, {
    ...withAuthCookies(options),
    body,
  });
}

export function getCurrentAuthUser(options?: AuthRequestOptions): Promise<CustomerAuthResponse> {
  return apiRequest<CustomerAuthResponse>("GET", authPaths.me, withAuthCookies(options));
}
