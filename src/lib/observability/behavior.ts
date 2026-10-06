import { trackBehaviorEvent } from "@/lib/api/analytics";
import { captureEvent } from "@/lib/observability/posthog";
import { matchRoute, productFromUrl, type ProductKind } from "@/lib/observability/route-pattern";
import type { ShopItem } from "@/lib/shop/store";

/**
 * Product and route behavior tracking. Every event fans out to two sinks:
 *
 * - PostHog (`captureEvent`) — product analytics for the business: funnels, conversion, replay and
 *   heatmaps. Events use the business taxonomy below (`course_viewed`, `checkout_started`, …).
 * - The backend (`trackBehaviorEvent`, via the same-origin `/api/b2c` door) — the analytics and
 *   recommendation history the platform owns. It keeps its own `event_type` names.
 *
 * Faro deliberately receives none of these: it is the engineering stream (errors, vitals, traces).
 *
 * Calls are fire-and-forget: a tracking failure must never affect what the visitor is doing, and a
 * no-op when PostHog is not configured or the backend is unreachable.
 */

/**
 * PostHog event names. `subscription_*`, `lesson_*` and `ai_*` have no flow in the app yet; they
 * are named here so the features that add them use the agreed taxonomy.
 */
export type ProductEvent =
  | `${ProductKind}_viewed`
  | "product_clicked"
  | "course_searched"
  | "wishlist_added"
  | "wishlist_removed"
  | "cart_added"
  | "cart_removed"
  | "coupon_applied"
  | "coupon_rejected"
  | "payment_method_selected"
  | "checkout_started"
  | "payment_completed"
  | "payment_failed"
  | "order_viewed"
  | "login_started"
  | "signed_up"
  | "signed_in"
  | "signed_out"
  | "auth_gate_opened"
  | "subscription_started"
  | "subscription_cancelled"
  | "lesson_started"
  | "lesson_completed"
  | "ai_advisor_opened"
  | "ai_recommendation_clicked";

/** Titles are capped so a stray long string cannot bloat an event. */
const TITLE_LIMIT = 120;

function clip(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.length > TITLE_LIMIT ? value.slice(0, TITLE_LIMIT) : value;
}

/**
 * The route pattern the visitor is on right now. Stamped on every page-scoped event so a click,
 * wishlist add or cart add can be attributed to the page (e.g. `/search`) it happened on, not only
 * page views.
 */
function currentRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return matchRoute(window.location.pathname).pattern;
}

type BackendEvent = {
  entityType: string;
  legacyId?: number | null;
  productId?: string | null;
  metadata?: Record<string, unknown>;
};

/** PostHog gets `event`; the backend keeps its historical `eventType`. */
function send(
  event: ProductEvent,
  eventType: string,
  attributes: Record<string, unknown>,
  backend: BackendEvent,
): void {
  captureEvent(event, attributes);
  void trackBehaviorEvent(
    {
      event_type: eventType,
      entity_type: backend.entityType,
      legacy_entity_id: backend.legacyId ?? null,
      product_id: backend.productId ?? null,
      metadata: backend.metadata,
    },
    { sameOrigin: true },
  ).catch(() => undefined);
}

/**
 * A route (initial load or client navigation). Only product detail pages emit an event —
 * `course_viewed`, `diploma_viewed`, … — page views themselves are PostHog's own `$pageview`.
 */
export function trackProductView(url: string): void {
  const match = matchRoute(url);
  if (!match.product) return;
  send(
    `${match.product.kind}_viewed`,
    "product_view",
    { route: match.pattern, product_kind: match.product.kind, legacy_entity_id: match.product.id },
    {
      entityType: "product",
      legacyId: match.product.id,
      metadata: { route: match.pattern, kind: match.product.kind },
    },
  );
}

export type ClickContext = { surface?: string; position?: number };

export function trackProductClick(
  product: { kind: ProductKind; id: number; title?: string | null },
  context?: ClickContext,
): void {
  const route = currentRoute();
  const attributes: Record<string, unknown> = {
    route,
    product_kind: product.kind,
    legacy_entity_id: product.id,
    title: clip(product.title),
    surface: context?.surface,
    position: context?.position,
  };
  send("product_clicked", "product_click", attributes, {
    entityType: "product",
    legacyId: product.id,
    metadata: { route: route ?? null, kind: product.kind, title: clip(product.title) ?? null, surface: context?.surface ?? null, position: context?.position ?? null },
  });
}

/** Click handler helper for a card: resolves the product from the detail-page href, if it is one. */
export function trackProductClickFromHref(
  href: string,
  title: string | null | undefined,
  context?: ClickContext,
): void {
  const product = productFromUrl(href);
  if (!product) return;
  trackProductClick({ kind: product.kind, id: product.id, title }, context);
}

function productMetadata(item: ShopItem): Record<string, unknown> {
  return {
    route: currentRoute() ?? null,
    kind: item.kind,
    title: clip(item.title) ?? null,
    price_amount: item.priceAmount ?? null,
  };
}

function productAttributes(item: ShopItem, action: "add" | "remove"): Record<string, unknown> {
  return {
    route: currentRoute(),
    product_kind: item.kind,
    legacy_entity_id: item.id,
    title: clip(item.title),
    price_amount: item.priceAmount ?? undefined,
    action,
  };
}

export function trackWishlist(item: ShopItem, added: boolean): void {
  const action = added ? "add" : "remove";
  send(added ? "wishlist_added" : "wishlist_removed", added ? "wishlist_add" : "wishlist_remove", productAttributes(item, action), {
    entityType: "product",
    legacyId: item.id,
    metadata: productMetadata(item),
  });
}

export function trackCart(item: ShopItem, added: boolean): void {
  const action = added ? "add" : "remove";
  send(added ? "cart_added" : "cart_removed", added ? "cart_add" : "cart_remove", productAttributes(item, action), {
    entityType: "product",
    legacyId: item.id,
    metadata: productMetadata(item),
  });
}

/** The "add everything from the wishlist" action: one event with the count and keys. */
export function trackCartBulk(items: readonly ShopItem[]): void {
  if (items.length === 0) return;
  const keys = items.map((item) => item.key);
  const route = currentRoute();
  send(
    "cart_added",
    "cart_add",
    { route, product_kind: "mixed", count: items.length, keys: keys.join(",") },
    { entityType: "product", metadata: { route: route ?? null, count: items.length, keys } },
  );
}

export type SearchSummary = {
  q?: string;
  types: readonly string[];
  categories: readonly string[];
  skills: readonly string[];
  tags: readonly string[];
  trainers: readonly string[];
  priceMin?: number | null;
  priceMax?: number | null;
  sort?: string;
  mode?: string;
  page?: number;
};

export function trackSearch(summary: SearchSummary): void {
  const filterCount = summary.categories.length + summary.skills.length + summary.tags.length + summary.trainers.length;
  const route = currentRoute();
  send(
    "course_searched",
    "search",
    {
      route,
      query: clip(summary.q),
      types: summary.types.join(","),
      sort: summary.sort,
      mode: summary.mode,
      page: summary.page ?? 1,
      filter_count: filterCount,
    },
    {
      entityType: "search",
      metadata: {
        route: route ?? null,
        q: clip(summary.q) ?? null,
        types: summary.types,
        categories: summary.categories,
        skills: summary.skills,
        tags: summary.tags,
        trainers: summary.trainers,
        price_min: summary.priceMin ?? null,
        price_max: summary.priceMax ?? null,
        sort: summary.sort ?? null,
        mode: summary.mode ?? null,
        page: summary.page ?? 1,
      },
    },
  );
}

export type AuthEvent = "login_started" | "registered" | "signed_in" | "signed_out" | "auth_gate_opened";

export function trackAuth(eventType: AuthEvent, metadata?: Record<string, unknown>): void {
  const route = currentRoute();
  const payload = { route, ...metadata };
  send(eventType === "registered" ? "signed_up" : eventType, eventType, payload, { entityType: "auth", metadata: { ...payload, route: route ?? null } });
}

export type CheckoutEvent = "order_created" | "payment_settled" | "order_viewed";

export function trackCheckout(
  eventType: CheckoutEvent,
  attributes: Record<string, string | number | boolean | undefined>,
  metadata?: Record<string, unknown>,
): void {
  const route = currentRoute();
  send(checkoutEvent(eventType, attributes), eventType, { route, ...attributes }, {
    entityType: "order",
    metadata: metadata ?? { ...attributes, route },
  });
}

function checkoutEvent(eventType: CheckoutEvent, attributes: Record<string, unknown>): ProductEvent {
  if (eventType === "order_created") return "checkout_started";
  if (eventType === "payment_settled") return attributes.status === "paid" ? "payment_completed" : "payment_failed";
  return "order_viewed";
}

/**
 * The quote's verdict on a coupon code (PostHog only: the backend sees the coupon on the order).
 * Fired once per code and verdict, not on every re-quote.
 */
export function trackCoupon(coupon: { code: string; status: string; discountAmount: number }, currency?: string): void {
  captureEvent(coupon.status === "applied" ? "coupon_applied" : "coupon_rejected", {
    route: currentRoute(),
    code: coupon.code.toUpperCase(),
    status: coupon.status,
    discount_amount: coupon.discountAmount,
    currency,
  });
}

/** The visitor picked a payment method (card, mada, apple_pay, tabby, tamara) on the cart page. */
export function trackPaymentMethod(method: string, total?: number, currency?: string): void {
  captureEvent("payment_method_selected", { route: currentRoute(), payment_method: method, total, currency });
}
