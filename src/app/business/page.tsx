import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getB2bLanding } from "@/features/business/api/get-b2b-landing";
import { BusinessPage } from "@/features/business/business-page";
import { businessPageCopy } from "@/features/business/content/b2b";
import { loadPricingPage } from "@/features/subscriptions/api/load-plans";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
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
  const [data, pricing] = await Promise.all([getB2bLanding(), loadPricingPage()]);
  const plans = pricing.plans.filter((plan) => plan.audience === "company");
  return <BusinessPage data={data} plans={plans} />;
}
