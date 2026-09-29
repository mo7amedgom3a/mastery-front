import type { Route } from "next";

/**
 * Single source of truth for internal URLs.
 *
 * Most destinations (listings, detail pages, auth) are not built yet, so `typedRoutes`
 * cannot verify them. They are cast here, once, instead of at every call site. When a page
 * ships, its entry keeps working unchanged. Render these with `prefetch={false}` until the
 * page exists (see `AppLink`).
 */
const route = (path: string) => path as Route;

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
  courses: route("/courses"),
  course: (slug: string) => route(`/courses/${encodeURIComponent(slug)}`),
  category: (id: number | string) => route(`/courses?category=${encodeURIComponent(String(id))}`),
  diplomas: route("/diplomas"),
  diploma: (slug: string) => route(`/diplomas/${encodeURIComponent(slug)}`),
  live: route("/live"),
  packages: route("/packages"),
  package: (id: number | string) => route(`/packages/${encodeURIComponent(String(id))}`),
  consultations: route("/consultations"),
  consultation: (id: number | string) => route(`/consultations/${encodeURIComponent(String(id))}`),
  business: route("/#business"),
  cart: route("/cart"),
  wishlist: route("/wishlist"),
  privacy: route("/privacy"),
  terms: route("/terms"),
} as const;
