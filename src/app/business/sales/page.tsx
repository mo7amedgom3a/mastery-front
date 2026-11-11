import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getBusinessCatalog } from "@/features/business/api/get-business-catalog";
import { salesLanding } from "@/features/business-sales/content/sales-landing";
import { SalesLandingPage } from "@/features/business-sales/sales-landing-page";

export const metadata: Metadata = {
  title: salesLanding.meta.title,
  description: salesLanding.meta.description,
  alternates: { canonical: routes.businessSales },
  // Keep out of search results until the sales offer, copy, and links are approved.
  robots: { index: false, follow: false },
  openGraph: {
    ...baseOpenGraph,
    url: routes.businessSales,
    title: salesLanding.meta.title,
    description: salesLanding.meta.description,
  },
};

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 600;

export default async function BusinessSalesRoute() {
  const catalog = await getBusinessCatalog();
  const salesCategory = catalog.categories.find((item) => item.code === "legacy-category-3");
  return <SalesLandingPage salesCategory={salesCategory} />;
}
