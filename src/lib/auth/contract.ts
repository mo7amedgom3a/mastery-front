import type { CustomerAuthResponse } from "@/lib/api/auth";

/**
 * What the browser and this app's `/api/auth/*` route handlers say to each other. Tokens are not
 * part of it: they stay in httpOnly cookies and in the server-to-server calls to the backend.
 */
export type AuthCustomer = CustomerAuthResponse;

export type AuthErrorCode =
  | "invalid_request"
  | "forbidden"
  | "invalid_code"
  | "email_not_allowed"
  | "register_failed"
  | "unauthenticated"
  | "rate_limited"
  | "unavailable";

/** `detail` is the message shown to the visitor; it is the field `ApiError` reads. */
export type AuthErrorBody = { code: AuthErrorCode; detail: string };

/** `resendAfter`: seconds until another code may be requested. */
export type CodeSentResponse = { sent: true; resendAfter: number };

export type CustomerResponse = { customer: AuthCustomer };

/** `refreshable`: no valid access token, but a refresh token is there to get one with. */
export type SessionResponse = CustomerResponse | { customer: null; refreshable: boolean };
