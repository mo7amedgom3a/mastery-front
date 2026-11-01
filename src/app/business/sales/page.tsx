import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { salesLanding } from "@/features/business-sales/content/sales-landing";
import { SalesLandingPage } from "@/features/business-sales/sales-landing-page";

export const metadata: Metadata = {
  title: salesLanding.meta.title,
  description: salesLanding.meta.description,
  alternates: { canonical: routes.businessSales },
  // Mock content: stays out of search results and the sitemap until the copy is approved.
  robots: { index: false, follow: false },
  openGraph: {
    ...baseOpenGraph,
    url: routes.businessSales,
    title: salesLanding.meta.title,
    description: salesLanding.meta.description,
  },
};

export default function BusinessSalesRoute() {
  return <SalesLandingPage />;
}
