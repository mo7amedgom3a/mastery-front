import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { loadPlan } from "@/features/subscriptions/api/load-plans";
import { PlanDetailPage } from "@/features/subscriptions/plan-detail-page";

// ISR: each plan page is built on its first visit, then refreshed at most every two minutes.
export const revalidate = 120;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

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
  const { slug } = await params;
  const plan = await loadPlan(slug);
  if (!plan) notFound();
  return <PlanDetailPage plan={plan} />;
}
