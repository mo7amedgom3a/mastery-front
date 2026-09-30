import type { Route } from "next";

/**
 * Single source of truth for internal URLs.
 *
 * Some destinations (auth) are not built yet, and listing URLs carry a query string, so
 * `typedRoutes` cannot verify them. They are cast here, once, instead of at every call site. When
 * a page ships, its entry keeps working unchanged. Render these with `prefetch={false}` until the
 * page exists (see `AppLink`).
 *
 * Every catalog listing is the search page with a filter preset (param order matches
 * `searchHref` in features/search/model/params.ts). `/courses`, `/diplomas`, `/packages` and
 * `/consultations` redirect there (next.config.ts).
 */
const route = (path: string) => path as Route;

/**
 * Detail-page segment: `{id}-{link_name}`, e.g. `4-Instagram_E-Commerce_Strategy`. The id is what the
 * API looks up; the name is for people and search engines, and pages redirect to fix it when wrong.
 */
export function productSlug(id: number, linkName?: string | null): string {
  const name = linkName?.trim().replace(/\s+/g, "_");
  return name ? `${id}-${name}` : String(id);
}

/** The id at the start of a detail-page segment; null when the segment doesn't start with one. */
export function parseProductSlug(segment: string): number | null {
  const match = segment.match(/^(\d+)(?:-|$)/);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Expert-profile segment: `{key}-{name}`, e.g. `9-د._مظهر_قنطقجي`. The key is what the API looks up:
 * the trainer id, or `c{id}` for an expert who only gives consultations.
 */
export function expertSlug(key: string | number, name?: string | null): string {
  const label = name?.trim().replace(/\s+/g, "_");
  return label ? `${key}-${label}` : String(key);
}

/** The expert key at the start of a profile segment; null when the segment doesn't start with one. */
export function parseExpertSlug(segment: string): string | null {
  return segment.match(/^(c?[1-9]\d{0,9})(?:-|$)/)?.[1] ?? null;
}

const expertRoute = (key: string | number, name?: string | null) =>
  route(`/experts/${encodeURIComponent(expertSlug(key, name))}`);

export type LandingSectionId = "offerings" | "courses" | "diplomas" | "packages" | "consultations" | "business" | "about" | "experts" | "faq";

export const routes = {
  home: "/" as Route,
  /** In-page anchor on the landing page; nav points here until the dedicated listing pages ship. */
  section: (id: LandingSectionId) => route(`/#${id}`),
  login: route("/login"),
  register: route("/register"),
  /** Auth pages with a return path, e.g. back to the card the visitor was on. */
  loginThen: (next: string) => route(`/login?next=${encodeURIComponent(next)}`),
  registerThen: (next: string) => route(`/register?next=${encodeURIComponent(next)}`),
  search: route("/search"),
  courses: route("/search?type=course"),
  course: (id: number, linkName?: string | null) =>
    route(`/courses/${encodeURIComponent(productSlug(id, linkName))}`),
  /** Courses of one legacy category; search category slugs are `legacy-category-{id}`. */
  category: (id: number | string) =>
    route(`/search?type=course&category=legacy-category-${encodeURIComponent(String(id))}`),
  diplomas: route("/search?type=diploma"),
  diploma: (id: number, linkName?: string | null) =>
    route(`/diplomas/${encodeURIComponent(productSlug(id, linkName))}`),
  /** One profile page for a trainer, a consultant, or someone who is both. */
  expert: expertRoute,
  /** A trainer's profile is their expert page: the trainer id is the expert key. */
  instructor: (id: number, name?: string | null) => expertRoute(id, name),
  live: route("/live"),
  packages: route("/search?type=package"),
  package: (id: number | string) => route(`/packages/${encodeURIComponent(String(id))}`),
  consultations: route("/search?type=consultation"),
  consultation: (id: number | string) => route(`/consultations/${encodeURIComponent(String(id))}`),
  business: route("/#business"),
  cart: route("/cart"),
  wishlist: route("/wishlist"),
  /** MOCK: stand-in for a payment provider's hosted page (see features/checkout). */
  checkoutGateway: (orderId: string) => route(`/checkout/mock-gateway?order=${encodeURIComponent(orderId)}`),
  checkoutSuccess: route("/checkout/success"),
  checkoutFailed: route("/checkout/failed"),
  privacy: route("/privacy"),
  terms: route("/terms"),
} as const;
