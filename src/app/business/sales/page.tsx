import type { Metadata } from "next";
import { connection } from "next/server";

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

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 600;

export default async function BusinessSalesRoute() {
  await connection();
  const catalog = await getBusinessCatalog();
  const salesCategory = catalog.categories.find((item) => item.code === "legacy-category-3");
  return <SalesLandingPage salesCategory={salesCategory} />;
}
