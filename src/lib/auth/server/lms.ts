import "server-only";

import type { NextRequest, NextResponse } from "next/server";

/**
 * The LMS session cookie. The LMS (lms.emasteryacademy.com, course player only) builds its session
 * from the legacy API's `refreshToken` cookie on the parent domain it shares with this site. Name,
 * domain and attributes match what the legacy API itself sets, or the browser keeps two cookies.
 */
export const LMS_REFRESH_COOKIE = "refreshToken";
const LMS_COOKIE_DOMAIN = process.env.LMS_COOKIE_DOMAIN ?? ".emasteryacademy.com";
const LMS_BASE_URL = (process.env.LMS_BASE_URL ?? "https://lms.emasteryacademy.com").replace(/\/$/, "");

/** The host this request was made to, as the visitor saw it. */
function publicHost(request: NextRequest): string {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0];
}

/** Whether this site runs under the LMS's parent domain: only then can the cookie reach the LMS. */
export function onSharedDomain(request: NextRequest): boolean {
  const host = publicHost(request);
  const parent = LMS_COOKIE_DOMAIN.replace(/^\./, "");
  return host === parent || host.endsWith(`.${parent}`);
}

/** The browser's current LMS refresh token, forwarded server to server only (never logged). */
export function browserLmsRefreshToken(request: NextRequest): string | null {
  return request.cookies.get(LMS_REFRESH_COOKIE)?.value || null;
}

export function setLmsCookie(response: NextResponse, token: string, expiresAt?: string | null): void {
  response.cookies.set(LMS_REFRESH_COOKIE, token, {
    domain: LMS_COOKIE_DOMAIN,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

/** Removes the shared cookie; only a `Set-Cookie` with the same domain and path does. */
export function clearLmsCookie(response: NextResponse): void {
  response.cookies.set(LMS_REFRESH_COOKIE, "", {
    domain: LMS_COOKIE_DOMAIN,
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}

/**
 * The LMS page that drops the LMS session kept in its own localStorage (its JWT stays usable for
 * up to an hour otherwise), then returns to this site. Only on the shared domain, where the LMS
 * could have been opened at all.
 */
export function lmsLogoutUrl(request: NextRequest): string | null {
  if (!onSharedDomain(request)) return null;
  const back = `https://${publicHost(request)}/`;
  return `${LMS_BASE_URL}/__logout?to=${encodeURIComponent(back)}`;
}
