import type { Route } from "next";

import { routes } from "@/config/routes";
import { parseCardSlug } from "@/lib/api/browse";

/** What a catalog card (or an advisor recommendation) names a product by. */
export type ProductRef = { product_type: string; slug: string };

/**
 * The storefront detail page of a catalog product; null when the slug carries no id the page can
 * be found by. Bundles and live trainings are addressed by slug, everything else by its legacy id.
 */
export function productHref(product: ProductRef, title?: string | null): Route | null {
  if (product.product_type === "bundle") return routes.bundle(product.slug);
  if (product.product_type === "live_diploma") return routes.liveTraining(product.slug);
  const parsed = parseCardSlug(product.slug);
  if (!parsed) return null;
  if (parsed.kind === "course") return routes.course(parsed.id, title);
  if (parsed.kind === "diploma") return routes.diploma(parsed.id, title);
  if (parsed.kind === "package") return routes.package(parsed.id);
  return routes.consultation(parsed.id);
}
