import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

/** Subscription plans (public) and the signed-in customer's subscriptions (`/api/v1/subscriptions`). */

type PlansOperation = "list_public_subscription_plans_api_v1_subscriptions_plans_get";
type PlanOperation = "get_public_subscription_plan_api_v1_subscriptions_plans__slug_or_id__get";
type FeaturesOperation = "list_public_subscription_features_api_v1_subscriptions_features_get";
type CheckoutOperation = "create_subscription_checkout_session_api_v1_subscriptions_checkout_post";
type MySubscriptionsOperation = "list_my_subscriptions_api_v1_subscriptions_me_get";
type MySubscriptionOperation = "get_my_subscription_detail_api_v1_subscriptions_me__subscription_id__get";
type PerksOperation = "my_consultation_perks_api_v1_subscriptions_me_perks_get";
type SelectionsOperation = "get_my_choose_x_selections_api_v1_subscriptions_me__subscription_id__selections_get";
type SelectOperation = "select_choose_x_course_api_v1_subscriptions_me__subscription_id__selections_post";
type ReplaceOperation = "replace_choose_x_course_api_v1_subscriptions_me__subscription_id__selections_replace_post";
type CancelOperation = "cancel_my_subscription_api_v1_subscriptions_me__subscription_id__cancel_post";
type TeamLeadOperation = "save_team_lead_api_v1_subscriptions_team_leads_post";

export type SubscriptionPlan = SuccessResponse<PlanOperation>;
export type SubscriptionPlansParams = QueryParams<PlansOperation>;
export type SubscriptionPlanFeature = NonNullable<SubscriptionPlan["features"]>[number];
export type SubscriptionPlanProduct = NonNullable<SubscriptionPlan["included_products"]>[number];
export type SubscriptionFeature = SuccessResponse<FeaturesOperation>[number];
export type SubscriptionCheckoutRequest = RequestBody<CheckoutOperation>;
export type SubscriptionCheckoutResponse = SuccessResponse<CheckoutOperation>;
export type MySubscription = SuccessResponse<MySubscriptionsOperation>[number];
export type MySubscriptionDetail = SuccessResponse<MySubscriptionOperation>;
export type ConsultationPerks = SuccessResponse<PerksOperation>;
export type ChooseXState = SuccessResponse<SelectionsOperation>;
export type TeamLeadRequest = RequestBody<TeamLeadOperation>;
export type TeamLead = SuccessResponse<TeamLeadOperation>;
type SubscriptionId = PathParams<MySubscriptionOperation>["subscription_id"];

const subscriptionPaths = {
  plans: "/api/v1/subscriptions/plans",
  plan: "/api/v1/subscriptions/plans/{slug_or_id}",
  features: "/api/v1/subscriptions/features",
  checkout: "/api/v1/subscriptions/checkout",
  teamLeads: "/api/v1/subscriptions/team-leads",
  mine: "/api/v1/subscriptions/me",
  one: "/api/v1/subscriptions/me/{subscription_id}",
  perks: "/api/v1/subscriptions/me/perks",
  selections: "/api/v1/subscriptions/me/{subscription_id}/selections",
  replace: "/api/v1/subscriptions/me/{subscription_id}/selections/replace",
  cancel: "/api/v1/subscriptions/me/{subscription_id}/cancel",
} as const;

// ---------------------------------------------------------------- public (server reads)

export function listSubscriptionPlans(
  params?: SubscriptionPlansParams,
  options?: ApiRequestOptions,
): Promise<SuccessResponse<PlansOperation>> {
  return apiRequest("GET", subscriptionPaths.plans, { ...options, query: { lang: "ar", ...params } });
}

export function getSubscriptionPlan(slugOrId: string, options?: ApiRequestOptions): Promise<SubscriptionPlan> {
  return apiRequest("GET", subscriptionPaths.plan, {
    ...options,
    path: { slug_or_id: slugOrId },
    query: { lang: "ar" },
  });
}

export function listSubscriptionFeatures(options?: ApiRequestOptions): Promise<SubscriptionFeature[]> {
  return apiRequest("GET", subscriptionPaths.features, { ...options, query: { lang: "ar" } });
}

// ---------------------------------------------------------------- signed-in customer

/** Opens a Stripe subscription checkout; one idempotency key per plan + seats. */
export function createSubscriptionCheckout(
  body: SubscriptionCheckoutRequest,
  idempotencyKey: string,
  options?: AuthenticatedRequestOptions,
): Promise<SubscriptionCheckoutResponse> {
  return customerRequest("POST", subscriptionPaths.checkout, {
    ...withAuthCookies(options),
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  });
}

/** Saves a company's details from step 1 of the team checkout (kept for follow-up even if it never pays). */
export function saveTeamLead(body: TeamLeadRequest, options?: AuthenticatedRequestOptions): Promise<TeamLead> {
  return customerRequest("POST", subscriptionPaths.teamLeads, { ...withAuthCookies(options), body });
}

export function listMySubscriptions(options?: AuthenticatedRequestOptions): Promise<MySubscription[]> {
  return customerRequest("GET", subscriptionPaths.mine, withAuthCookies(options));
}

export function getMySubscription(subscriptionId: SubscriptionId, options?: AuthenticatedRequestOptions): Promise<MySubscriptionDetail> {
  return customerRequest("GET", subscriptionPaths.one, { ...withAuthCookies(options), path: { subscription_id: subscriptionId } });
}

export function getConsultationPerks(options?: AuthenticatedRequestOptions): Promise<ConsultationPerks> {
  return customerRequest("GET", subscriptionPaths.perks, withAuthCookies(options));
}

export function getChooseXState(subscriptionId: SubscriptionId, options?: AuthenticatedRequestOptions): Promise<ChooseXState> {
  return customerRequest("GET", subscriptionPaths.selections, {
    ...withAuthCookies(options),
    path: { subscription_id: subscriptionId },
    query: { lang: "ar" },
  });
}

export function selectChooseXCourse(subscriptionId: SubscriptionId, productId: string): Promise<SuccessResponse<SelectOperation>> {
  return customerRequest("POST", subscriptionPaths.selections, {
    ...withAuthCookies(),
    path: { subscription_id: subscriptionId },
    body: { product_id: productId },
  });
}

export function replaceChooseXCourse(
  subscriptionId: SubscriptionId,
  oldProductId: string,
  newProductId: string,
): Promise<SuccessResponse<ReplaceOperation>> {
  return customerRequest("POST", subscriptionPaths.replace, {
    ...withAuthCookies(),
    path: { subscription_id: subscriptionId },
    body: { old_product_id: oldProductId, new_product_id: newProductId },
  });
}

/** Stops renewal; access stays until the end of the paid period. */
export function cancelMySubscription(subscriptionId: SubscriptionId): Promise<SuccessResponse<CancelOperation>> {
  return customerRequest("POST", subscriptionPaths.cancel, {
    ...withAuthCookies(),
    path: { subscription_id: subscriptionId },
    body: { immediate: false },
  });
}

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  mine: () => [...subscriptionKeys.all, "mine"] as const,
  one: (id: string) => [...subscriptionKeys.all, "one", id] as const,
  perks: () => [...subscriptionKeys.all, "perks"] as const,
  selections: (id: string) => [...subscriptionKeys.all, "selections", id] as const,
};

export const subscriptionQueries = {
  mine: () => queryOptions({ queryKey: subscriptionKeys.mine(), queryFn: () => listMySubscriptions() }),
  one: (id: string) => queryOptions({ queryKey: subscriptionKeys.one(id), queryFn: () => getMySubscription(id) }),
  perks: () => queryOptions({ queryKey: subscriptionKeys.perks(), queryFn: () => getConsultationPerks(), staleTime: 30_000 }),
  selections: (id: string) => queryOptions({ queryKey: subscriptionKeys.selections(id), queryFn: () => getChooseXState(id) }),
};
