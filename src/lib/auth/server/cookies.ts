import "server-only";

import type { NextResponse } from "next/server";

import { isAuthCookieSecure } from "@/config/env";
import type { TokenResponse } from "@/lib/api/auth";
import { ACCESS_COOKIE, AUTH_API_PATH, CHALLENGE_COOKIE, REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookie-names";

export const CHALLENGE_MAX_AGE_SECONDS = 600;

/**
 * The session, as cookies JavaScript can't read. The access token goes with every request to this
 * site; the refresh token only to `/api/auth/*`, and never on a request started by another site.
 */
export function setSessionCookies(response: NextResponse, tokens: TokenResponse): void {
  const secure = isAuthCookieSecure();
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expires_in,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: AUTH_API_PATH,
    maxAge: tokens.refresh_expires_in,
  });
  response.cookies.set(SESSION_COOKIE, "1", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.refresh_expires_in,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  expire(response, ACCESS_COOKIE, "/", "lax");
  expire(response, REFRESH_COOKIE, AUTH_API_PATH, "strict");
  expire(response, SESSION_COOKIE, "/", "lax");
}

export function setChallengeCookie(response: NextResponse, sealed: string): void {
  response.cookies.set(CHALLENGE_COOKIE, sealed, {
    httpOnly: true,
    secure: isAuthCookieSecure(),
    sameSite: "strict",
    path: AUTH_API_PATH,
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  });
}

export function clearChallengeCookie(response: NextResponse): void {
  expire(response, CHALLENGE_COOKIE, AUTH_API_PATH, "strict");
}

/** A cookie is only removed by a `Set-Cookie` with the same path it was set on. */
function expire(response: NextResponse, name: string, path: string, sameSite: "lax" | "strict"): void {
  response.cookies.set(name, "", { httpOnly: true, secure: isAuthCookieSecure(), sameSite, path, maxAge: 0 });
}
