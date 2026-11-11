import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { loadPricingPage } from "@/features/subscriptions/api/load-plans";
import { SubscriptionsPage } from "@/features/subscriptions/subscriptions-page";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 120;

const title = "اشتراكات ماستري";
const description = "باقات اشتراك شهرية وسنوية للأفراد والشركات: دورات ودبلومات واستشارات مع الخبراء ومخطط تعلّم ذكي.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: routes.subscriptions, languages: { ar: routes.subscriptions, "x-default": routes.subscriptions } },
  openGraph: { ...baseOpenGraph, url: routes.subscriptions, title, description },
};

export default async function SubscriptionsRoute() {
  return <SubscriptionsPage data={await loadPricingPage()} />;
}
