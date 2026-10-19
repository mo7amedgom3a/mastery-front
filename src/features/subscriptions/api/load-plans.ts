import "server-only";

import { cache } from "react";

import { listSubscriptionFeatures, getSubscriptionPlan, listSubscriptionPlans } from "@/lib/api/subscriptions";
import { ApiError } from "@/lib/api/client";
import { cachedRead } from "@/lib/api/server-cache";

import { toCatalogFeatureVM, toPlanVM, type CatalogFeatureVM, type PlanVM } from "../model/plans";

/** Seconds a plans page is served from cache; admin edits show up within this window. */
export const SUBSCRIPTIONS_REVALIDATE_SECONDS = 120;
const read = cachedRead(SUBSCRIPTIONS_REVALIDATE_SECONDS, ["subscriptions"]);

export type PricingPageData = { plans: PlanVM[]; catalog: CatalogFeatureVM[] };

/** Published plans and the feature catalog. Empty when the API is down, so the page still renders. */
export const loadPricingPage = cache(async (): Promise<PricingPageData> => {
  const [plans, features] = await Promise.allSettled([listSubscriptionPlans({}, read), listSubscriptionFeatures(read)]);
  if (plans.status === "rejected") console.error("[api] subscription plans request failed", plans.reason);
  return {
    plans: plans.status === "fulfilled" ? plans.value.map(toPlanVM) : [],
    catalog: features.status === "fulfilled" ? features.value.map(toCatalogFeatureVM) : [],
  };
});

/** One published plan, or null when it doesn't exist (or isn't published). */
export const loadPlan = cache(async (slug: string): Promise<PlanVM | null> => {
  try {
    return toPlanVM(await getSubscriptionPlan(slug, read));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
