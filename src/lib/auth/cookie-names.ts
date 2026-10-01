/** Session cookies, set on this site's own origin by the `/api/auth/*` route handlers. */
export const ACCESS_COOKIE = "b2c_access_token";
export const REFRESH_COOKIE = "b2c_refresh_token";
/** Carries no secret: says a session may exist, for code that can't see the refresh cookie's path. */
export const SESSION_COOKIE = "b2c_session";
export const CHALLENGE_COOKIE = "b2c_login_challenge";
/** The only path the refresh token and the pending login are ever sent to. */
export const AUTH_API_PATH = "/api/auth";
