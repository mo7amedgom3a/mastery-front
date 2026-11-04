import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { loadPlan } from "@/features/subscriptions/api/load-plans";
import { PlanDetailPage } from "@/features/subscriptions/plan-detail-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 120;

export async function generateMetadata({ params }: PageProps<"/subscriptions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const plan = await loadPlan(slug);
  if (!plan) return { title: "الباقة غير متاحة" };
  const description = plan.summary ?? "اشتراك ماستري: دورات ودبلومات واستشارات مع الخبراء.";
  return {
    title: plan.title,
    description,
    alternates: { canonical: routes.subscription(plan.slug) },
    openGraph: { ...baseOpenGraph, url: routes.subscription(plan.slug), title: plan.title, description },
  };
}

export default async function SubscriptionPlanRoute({ params }: PageProps<"/subscriptions/[slug]">) {
  await connection();
  const { slug } = await params;
  const plan = await loadPlan(slug);
  if (!plan) notFound();
  return <PlanDetailPage plan={plan} />;
}
