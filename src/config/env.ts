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

/** Public origin of this site, used for canonical URLs, sitemap and structured data. */
export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  try {
    new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }

  return value.replace(/\/$/, "");
}
