import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getB2bLanding } from "@/features/business/api/get-b2b-landing";
import { B2bLandingPage } from "@/features/business/b2b-landing-page";
import { b2bFaq, b2bLandingMeta } from "@/features/business/content/b2b-landing";
import { B2bJsonLd } from "@/features/business/seo/b2b-json-ld";
import { loadPricingPage } from "@/features/subscriptions/api/load-plans";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
export const revalidate = 600;

export const metadata: Metadata = {
  title: b2bLandingMeta.title,
  description: b2bLandingMeta.description,
  alternates: {
    canonical: routes.businessB2b,
    languages: { ar: routes.businessB2b, "x-default": routes.businessB2b },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.businessB2b,
    title: b2bLandingMeta.title,
    description: b2bLandingMeta.description,
  },
};

export default async function BusinessB2bRoute() {
  await connection();
  const [data, pricing] = await Promise.all([getB2bLanding(), loadPricingPage()]);
  const plans = pricing.plans.filter((plan) => plan.audience === "company");
  return (
    <>
      <B2bJsonLd faqs={b2bFaq.items} />
      <B2bLandingPage data={data} plans={plans} />
    </>
  );
}
