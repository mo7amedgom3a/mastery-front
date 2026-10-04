import { trackBehaviorEvent } from "@/lib/api/analytics";
import { pushFaroEvent } from "@/lib/observability/faro";
import { matchRoute, productFromUrl, type ProductKind } from "@/lib/observability/route-pattern";
import type { ShopItem } from "@/lib/shop/store";

/**
 * Product and route behavior tracking. Every event fans out to two sinks:
 *
 * - Faro (`pushFaroEvent`) — Grafana dashboards and funnels, correlated with RUM sessions, traces
 *   and errors.
 * - The backend (`trackBehaviorEvent`, via the same-origin `/api/b2c` door) — the analytics and
 *   recommendation history the platform owns.
 *
 * Calls are fire-and-forget: a tracking failure must never affect what the visitor is doing, and a
 * no-op when Faro is not configured or the backend is unreachable.
 */

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

function send(eventType: string, attributes: Record<string, unknown>, backend: BackendEvent): void {
  pushFaroEvent(eventType, attributes);
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
 * A route change (initial load or client navigation). Always a Faro `page_view`; product detail
 * pages additionally emit a backend `product_view`.
 */
export function trackPageView(input: { url: string; navigationType: string }): void {
  const match = matchRoute(input.url);
  const attributes: Record<string, unknown> = {
    route: match.pattern,
    navigation_type: input.navigationType,
  };

  if (match.product) {
    attributes.product_kind = match.product.kind;
    attributes.legacy_entity_id = match.product.id;
    send("product_view", attributes, {
      entityType: "product",
      legacyId: match.product.id,
      metadata: { route: match.pattern, kind: match.product.kind },
    });
    return;
  }

  // Route popularity is a RUM concern; the backend only needs entity events.
  pushFaroEvent("page_view", attributes);
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
  send("product_click", attributes, {
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
  send(added ? "wishlist_add" : "wishlist_remove", productAttributes(item, action), {
    entityType: "product",
    legacyId: item.id,
    metadata: productMetadata(item),
  });
}

export function trackCart(item: ShopItem, added: boolean): void {
  const action = added ? "add" : "remove";
  send(added ? "cart_add" : "cart_remove", productAttributes(item, action), {
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
  send(eventType, payload, { entityType: "auth", metadata: { ...payload, route: route ?? null } });
}

export type CheckoutEvent = "order_created" | "payment_settled" | "order_viewed";

export function trackCheckout(
  eventType: CheckoutEvent,
  attributes: Record<string, string | number | boolean | undefined>,
  metadata?: Record<string, unknown>,
): void {
  const route = currentRoute();
  send(eventType, { route, ...attributes }, { entityType: "order", metadata: metadata ?? { ...attributes, route } });
}
