import type { Route } from "next";

import { routes } from "@/config/routes";

import { parseShopKey, type ShopItemKind } from "./contract";

/**
 * Landing cards carry legacy ids; the account (wishlist, cart) is keyed by catalog `product_id`
 * (UUID). The catalog slug for a legacy item is `${kind}-${legacyId}` (e.g. `course-4`).
 */
export function catalogSlug(item: { kind: ShopItemKind; id: number }): string {
  if (item.kind === "live_diploma" && "slug" in item && typeof item.slug === "string") return item.slug;
  return `${item.kind}-${item.id}`;
}

const SLUG_PATTERN = /^(course|diploma|package|consultation)-([1-9]\d{0,9})$/;

/** The shop key (`course:4`) of a catalog slug (`course-4`); null for products not sold from this site. */
export function shopKeyFromSlug(slug: string, productType?: string): string | null {
  if (productType === "live_diploma" && /^[a-z0-9-]+$/.test(slug)) return `live_diploma:${slug}`;
  const match = slug.match(SLUG_PATTERN);
  return match && parseShopKey(`${match[1]}:${match[2]}`) ? `${match[1]}:${match[2]}` : null;
}

/**
 * Page of a catalog product by its slug and type (recommendations, owned products). Bundles are
 * addressed by slug; legacy items by their `${kind}-${id}` slug; anything else falls back to search.
 */
export function catalogProductHref(slug: string, productType: string): string {
  if (productType === "live_diploma") return routes.liveTraining(slug);
  if (productType === "bundle") return routes.bundle(slug);
  const key = shopKeyFromSlug(slug);
  const parsed = key ? parseShopKey(key) : null;
  if (parsed) return shopItemHref(parsed.kind, parsed.id);
  // Expert-created consultations (and any B2C product addressed only by slug).
  return productType === "consultation" && slug ? routes.consultation(slug) : routes.search;
}

export function shopItemHref(kind: ShopItemKind, id: number): string {
  if (kind === "live_diploma") return routes.liveTraining(String(id));
  if (kind === "diploma") return routes.diploma(id);
  if (kind === "package") return routes.package(id);
  if (kind === "consultation") return routes.consultation(id);
  return routes.course(id);
}

/** Bundles and packages hold other programs, so their card opens the contents instead of the LMS. */
export function isCompositeProduct(productType: string | null | undefined): boolean {
  return productType === "bundle" || productType === "package";
}

/** A consultation's student details page (`/students/consultations/...`), from its catalog slug. */
export function studentConsultationHref(slug: string | null | undefined): Route | null {
  if (!slug) return null;
  const legacy = slug.match(/^consultation-([1-9]\d{0,9})$/);
  if (legacy) return routes.studentConsultation(legacy[1]);
  // Expert-created consultations are addressed by their whole catalog slug.
  return slug.startsWith("expert-consultation-") ? routes.studentConsultation(slug) : null;
}

/**
 * The student-side contents page of a bundle/package (`/students/learning/...`); null when the
 * product can't be addressed by its slug (bundles use the slug, packages their numeric id).
 */
export function studentProgramHref(
  productType: string | null | undefined,
  slug: string | null | undefined,
): Route | null {
  if (!slug) return null;
  if (productType === "bundle") return routes.studentBundle(slug);
  if (productType === "package") {
    const key = shopKeyFromSlug(slug);
    const parsed = key ? parseShopKey(key) : null;
    return parsed?.kind === "package" ? routes.studentPackage(parsed.id) : null;
  }
  return null;
}
