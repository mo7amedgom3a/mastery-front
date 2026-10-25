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
 * the trainer id, `c{id}` for an expert who only gives consultations, or the instructor uuid of a B2C-only expert.
 */
export function expertSlug(key: string | number, name?: string | null): string {
  const label = name?.trim().replace(/\s+/g, "_");
  return label ? `${key}-${label}` : String(key);
}

/** The expert key at the start of a profile segment; null when the segment doesn't start with one. */
export function parseExpertSlug(segment: string): string | null {
  return segment.match(/^(c?[1-9]\d{0,9}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i)?.[1] ?? null;
}

/** The expert key of a Studio instructor ref (`legacy:trainer:9`, `legacy:consultant:4`, `b2c:<uuid>`). */
export function expertKeyOfRef(ref: string): string | null {
  const legacy = ref.match(/^legacy:(trainer|consultant):(\d+)$/);
  if (legacy) {
    return legacy[1] === "trainer" ? legacy[2] : `c${legacy[2]}`;
  }
  return ref.startsWith("b2c:") ? parseExpertSlug(ref.slice(4)) : null;
}

const expertRoute = (key: string | number, name?: string | null) =>
  route(`/experts/${encodeURIComponent(expertSlug(key, name))}`);

export type LandingSectionId = "offerings" | "courses" | "diplomas" | "packages" | "bundles" | "consultations" | "business" | "about" | "experts" | "faq";

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
  /** One product type inside a catalog category slug (`legacy-category-27`, `marketing/sales`). */
  categoryOf: (type: "course" | "diploma" | "package" | "consultation", slug: string) =>
    route(`/search?type=${type}&category=${encodeURIComponent(slug)}`),
  diplomas: route("/search?type=diploma"),
  diploma: (id: number, linkName?: string | null) =>
    route(`/diplomas/${encodeURIComponent(productSlug(id, linkName))}`),
  /** Every trainer and expert, searchable by name and field (`?q=&field=&kind=`). */
  experts: route("/experts"),
  /** One profile page for a trainer, a consultant, or someone who is both. */
  expert: expertRoute,
  /** A trainer's profile is their expert page: the trainer id is the expert key. */
  instructor: (id: number, name?: string | null) => expertRoute(id, name),
  live: route("/live"),
  liveTraining: (slug: string) => route(`/live/${encodeURIComponent(slug)}`),
  packages: route("/search?type=package"),
  package: (id: number | string) => route(`/packages/${encodeURIComponent(String(id))}`),
  /** حزم ماستري: catalog bundles (diplomas, courses, consultations…) keyed by their catalog slug. */
  bundle: (slug: string) => route(`/bundles/${encodeURIComponent(slug)}`),
  consultations: route("/search?type=consultation"),
  consultation: (id: number | string) => route(`/consultations/${encodeURIComponent(String(id))}`),
  business: route("/business"),
  /** The company training request, one page per step (`/business/request/company`, …). */
  businessRequest: (step?: string) => route(step ? `/business/request/${encodeURIComponent(step)}` : "/business/request"),
  businessRequestDone: route("/business/request/done"),
  /** Subscription plans (pricing) and one plan's page, keyed by its catalog slug. */
  subscriptions: route("/subscriptions"),
  subscriptionsFor: (audience: "individual" | "company") => route(`/subscriptions?audience=${audience}`),
  subscription: (slug: string) => route(`/subscriptions/${encodeURIComponent(slug)}`),
  /** A company plan's checkout flow: team details, then review with the live price (`/subscriptions/{slug}/team/details`). */
  subscriptionTeam: (slug: string, step: "details" | "review") =>
    route(`/subscriptions/${encodeURIComponent(slug)}/team/${step}`),
  trainers: route("/trainers"),
  marketers: route("/marketers"),
  /** The step-by-step marketer application (`/marketers/apply/<step>`). */
  marketersApply: (step?: string) => route(step ? `/marketers/apply/${encodeURIComponent(step)}` : "/marketers/apply"),
  marketersApplyDone: route("/marketers/apply/done"),
  cart: route("/cart"),
  wishlist: route("/wishlist"),
  /** Stripe sends the buyer back here; the backend appends `order_id` and `payment_intent_id`. */
  checkoutSuccess: route("/checkout/success"),
  checkoutCancelled: route("/checkout/cancelled"),
  checkoutFailed: route("/checkout/failed"),
  /** The signed-in student's area (`/students/*`, guests are sent to sign in by `proxy.ts`). */
  studentHome: route("/students"),
  studentOnboarding: (step?: string) => route(step ? `/students/onboarding/${encodeURIComponent(step)}` : "/students/onboarding"),
  studentOnboardingStart: route("/students/onboarding/start"),
  studentLearning: route("/students/learning"),
  studentProfile: route("/students/profile"),
  studentTransactions: route("/students/transactions"),
  studentInvoices: route("/students/invoices"),
  studentWishlist: route("/students/wishlist"),
  studentCart: route("/students/cart"),
  studentOrders: route("/students/orders"),
  studentVouchers: route("/students/vouchers"),
  studentReferrals: route("/students/referrals"),
  studentNotifications: route("/students/notifications"),
  studentOrder: (orderId: string) => route(`/students/orders/${encodeURIComponent(orderId)}`),
  studentAccess: route("/students/access"),
  /** The customer's subscription: plan, renewal, included programs and Choose-X picks. */
  studentSubscription: route("/students/subscription"),
  /** Booked consultations; Stripe returns here after paying for one. */
  studentConsultations: route("/students/consultations"),
  studentConsultation: (bookingId: string) => route(`/students/consultations/${encodeURIComponent(bookingId)}`),
  /** The live meeting room, full screen (outside the dashboard chrome). */
  consultationSession: (bookingId: string) => route(`/students/session/${encodeURIComponent(bookingId)}`),
  /** Student customer support & ticket management. */
  studentSupport: route("/students/support"),
  studentSupportNew: route("/students/support/new"),
  studentSupportTicket: (ticketId: string) => route(`/students/support/${encodeURIComponent(ticketId)}`),
  /** The expert dashboard (`/expert/*`, guests are sent to sign in by `proxy.ts`). */
  expertDashboard: route("/expert"),
  expertServices: route("/expert/consultations"),
  expertBookings: route("/expert/bookings"),
  expertBooking: (bookingId: string) => route(`/expert/bookings/${encodeURIComponent(bookingId)}`),
  expertCalendar: route("/expert/calendar"),
  expertSettings: route("/expert/settings"),
  /** The marketer dashboard (signed in; the public programme page is `marketers`). */
  marketerDashboard: route("/marketer"),
  marketerCustomers: route("/marketer/customers"),
  marketerSales: route("/marketer/sales"),
  marketerCommissions: route("/marketer/commissions"),
  marketerCoupons: route("/marketer/coupons"),
  marketerPayouts: route("/marketer/payouts"),
  marketerProfile: route("/marketer/profile"),
  privacy: route("/privacy"),
  terms: route("/terms"),
} as const;
