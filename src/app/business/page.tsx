import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getB2bLanding } from "@/features/business/api/get-b2b-landing";
import { BusinessPage } from "@/features/business/business-page";
import { businessPageCopy } from "@/features/business/content/b2b";
import { loadPricingPage } from "@/features/subscriptions/api/load-plans";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 600;

export const metadata: Metadata = {
  title: businessPageCopy.meta.title,
  description: businessPageCopy.meta.description,
  alternates: {
    canonical: routes.business,
    languages: { ar: routes.business, "x-default": routes.business },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.business,
    title: businessPageCopy.meta.title,
    description: businessPageCopy.meta.description,
  },
};

export default async function BusinessRoute() {
  await connection();
  const [data, pricing] = await Promise.all([getB2bLanding(), loadPricingPage()]);
  const plans = pricing.plans.filter((plan) => plan.audience === "company");
  return <BusinessPage data={data} plans={plans} />;
}
