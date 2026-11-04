import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { loadPricingPage } from "@/features/subscriptions/api/load-plans";
import { SubscriptionsPage } from "@/features/subscriptions/subscriptions-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
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
  await connection();
  return <SubscriptionsPage data={await loadPricingPage()} />;
}
