const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";
const DEFAULT_SITE_URL = "https://emasteryacademy.com";

export function getApiBaseUrl(): string {
  const value = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;

  try {
    new URL(value);
  } catch {
    throw new Error("API_BASE_URL must be a valid absolute URL");
  }

  return value.replace(/\/$/, "");
}

const DEFAULT_LEGACY_FORMS_BASE_URL = "https://v1.emasteryacademy.com";

/**
 * Origin of the legacy backend that still receives the trainer-application and company-training
 * forms (`/v1/trainerapplication`, `/api/b2b/subscribe`). Server-only: its CORS allows the brand
 * domain alone, so the forms post to it from Server Actions.
 */
export function getLegacyFormsBaseUrl(): string {
  const value = process.env.LEGACY_FORMS_BASE_URL || DEFAULT_LEGACY_FORMS_BASE_URL;

  try {
    new URL(value);
  } catch {
    throw new Error("LEGACY_FORMS_BASE_URL must be a valid absolute URL");
  }

  return value.replace(/\/$/, "");
}

/**
 * Whether search engines may index this deployment. Staging/preview opt out explicitly with
 * `NEXT_PUBLIC_ENV=staging` (any value other than "production"); Vercel previews opt out on their
 * own. A missing variable means production, so a misconfigured deploy can never de-index the site.
 */
export function isIndexable(): boolean {
  const env = process.env.NEXT_PUBLIC_ENV;
  if (env && env !== "production") return false;
  const vercelEnv = process.env.VERCEL_ENV;
  return !vercelEnv || vercelEnv === "production";
}

/**
 * MOCK: whether the simulated checkout (order creation and the stand-in payment page) is switched
 * on. The real order and payment APIs don't exist yet, so production keeps it off and the cart only
 * says that payment is coming. On by default outside production; `NEXT_PUBLIC_MOCK_CHECKOUT` forces
 * it either way ("true" / "false"), e.g. "true" on staging.
 * TODO(api): remove with the mock once checkout talks to the backend.
 */
export function isMockCheckoutEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_MOCK_CHECKOUT;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Host Vercel serves this deployment on (system env vars, no scheme), if any. */
function vercelSiteUrl(): string | undefined {
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);
  return host ? `https://${host}` : undefined;
}

/**
 * Public origin of this site, used for canonical URLs, sitemap, structured data and — through
 * `metadataBase` — the absolute og:image / twitter:image URLs. It must be the host that actually
 * serves this app: pointing it at another site makes every share preview image 404.
 * Order: NEXT_PUBLIC_SITE_URL (set it to the real domain once it points here) → the Vercel
 * deployment host → the brand domain.
 */
export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL || vercelSiteUrl() || DEFAULT_SITE_URL;

  try {
    new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }

  return value.replace(/\/$/, "");
}

export type BunnyConfig = { libraryId: string; cdnHostname: string };

/**
 * Bunny Stream library for promo videos. Null when unset or malformed: pages then show no video,
 * which is the same fallback as a missing video.
 */
export function getBunnyConfig(): BunnyConfig | null {
  const libraryId = process.env.BUNNY_LIBRARY_ID?.trim();
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME?.trim();
  if (!libraryId || !/^\d+$/.test(libraryId) || !cdnHostname || !/^[a-z0-9.-]+$/i.test(cdnHostname)) {
    return null;
  }
  return { libraryId, cdnHostname };
}

/**
 * Whether session cookies carry `Secure`. On in production; `AUTH_COOKIE_SECURE=false` allows a
 * production build to be tried over plain HTTP (a browser drops `Secure` cookies there).
 */
export function isAuthCookieSecure(): boolean {
  const flag = process.env.AUTH_COOKIE_SECURE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

const DEV_AUTH_COOKIE_SECRET = "development-only-auth-cookie-secret-change-me";

/**
 * Key material for sealing the pending-login cookie (see `lib/auth/server/challenge`). Required in
 * production: without it sign-in is refused rather than sealed with a key anyone can read here.
 */
export function getAuthCookieSecret(): string {
  const value = process.env.AUTH_COOKIE_SECRET?.trim();
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_COOKIE_SECRET must be set to at least 32 characters");
  }
  return value || DEV_AUTH_COOKIE_SECRET;
}
