import { parseProductSlug } from "@/config/routes";

/**
 * Maps a URL path to the route pattern it resolves to, plus the catalog product it addresses when
 * it is a detail page. Shared by the client behavior events (route-level dashboards) and the server
 * span processor (per-route latency/errors), so both sides aggregate under the same names.
 *
 * Client and server safe: it only does string work and imports the pure slug helpers.
 */

export type ProductKind = "course" | "diploma" | "package" | "consultation";

export type ProductRef = {
  kind: ProductKind;
  /** The legacy catalog id encoded in the slug (what the backend analytics endpoint calls legacy_entity_id). */
  id: number;
};

export type RouteMatch = {
  pattern: string;
  product?: ProductRef;
};

const STATIC_ROUTES: Record<string, string> = {
  "/": "/",
  "/search": "/search",
  "/live": "/live",
  "/cart": "/cart",
  "/wishlist": "/wishlist",
  "/login": "/login",
  "/register": "/register",
  "/business": "/business",
  "/trainers": "/trainers",
  "/privacy": "/privacy",
  "/terms": "/terms",
  "/checkout/success": "/checkout/success",
  "/checkout/cancelled": "/checkout/cancelled",
  "/checkout/failed": "/checkout/failed",
  "/students/orders": "/students/orders",
  "/students/access": "/students/access",
};

const API_ROUTES: readonly (readonly [RegExp, string])[] = [
  [/^\/api\/auth\/(login|logout|refresh|register|resend|session|verify)$/, "/api/auth/[action]"],
  [/^\/api\/b2c\/.+$/, "/api/b2c/[...path]"],
  [/^\/api\/live-trainings\/[^/]+$/, "/api/live-trainings/[slug]"],
  [/^\/api\/live-trainings$/, "/api/live-trainings"],
  [/^\/api\/revalidate$/, "/api/revalidate"],
  [/^\/api\/search\/recommendations$/, "/api/search/recommendations"],
  [/^\/api\/shop\/cart\/quote$/, "/api/shop/cart/quote"],
  [/^\/api\/shop\/items\/resolve$/, "/api/shop/items/resolve"],
  [/^\/api\/.+$/, "/api/[...path]"],
];

const PRODUCT_ROUTES: Record<string, { pattern: string; kind: ProductKind }> = {
  courses: { pattern: "/courses/[slug]", kind: "course" },
  diplomas: { pattern: "/diplomas/[slug]", kind: "diploma" },
  packages: { pattern: "/packages/[slug]", kind: "package" },
  consultations: { pattern: "/consultations/[slug]", kind: "consultation" },
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** The pathname of a URL or path string, without query/hash and without a trailing slash. */
export function pathnameOf(url: string): string {
  const withoutHash = url.split("#")[0];
  const path = withoutHash.split("?")[0];
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
}

export function matchRoute(url: string): RouteMatch {
  const path = pathnameOf(url);

  const staticPattern = STATIC_ROUTES[path];
  if (staticPattern) return { pattern: staticPattern };

  if (path.startsWith("/api/")) {
    for (const [pattern, name] of API_ROUTES) {
      if (pattern.test(path)) return { pattern: name };
    }
    return { pattern: "/api/[...path]" };
  }

  const [first, second] = path.split("/").filter(Boolean);

  if (first && second) {
    const segment = safeDecode(second);
    if (first === "experts") return { pattern: "/experts/[key]" };
    if (first === "live") return { pattern: "/live/[slug]" };
    // Order ids stay out of the pattern: one series for every order page.
    if (first === "students" && second === "orders") return { pattern: "/students/orders/[orderId]" };

    const product = PRODUCT_ROUTES[first];
    if (product) {
      const id = parseProductSlug(segment);
      return id === null ? { pattern: product.pattern } : { pattern: product.pattern, product: { kind: product.kind, id } };
    }
  }

  if (first === "experts") {
    // Any expert segment (the key parser tolerates `c{id}`), even a malformed one.
    return { pattern: "/experts/[key]" };
  }

  return { pattern: "/[...slug]" };
}

/** The product addressed by a detail-page URL, or undefined for any other route. */
export function productFromUrl(url: string): (ProductRef & { pattern: string }) | undefined {
  const match = matchRoute(url);
  return match.product ? { ...match.product, pattern: match.pattern } : undefined;
}
