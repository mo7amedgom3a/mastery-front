import { queryOptions } from "@tanstack/react-query";

import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type MyReferralsOperation = "my_referrals_api_v1_me_referrals_get";
type MyInvitesOperation = "my_invites_api_v1_me_referrals_invites_get";
type MyEarningsOperation = "my_earnings_api_v1_me_affiliate_earnings_get";
type MyPayoutsOperation = "my_payouts_api_v1_me_affiliate_payouts_get";
type RequestPayoutOperation = "request_payout_api_v1_me_affiliate_payouts_post";
type PayoutDetailsOperation = "my_payout_details_api_v1_me_affiliate_payout_details_get";
type SavePayoutDetailsOperation = "save_payout_details_api_v1_me_affiliate_payout_details_put";

export type MyReferralsResponse = SuccessResponse<MyReferralsOperation>;
export type PartnerConversion = NonNullable<MyReferralsResponse["conversions"]>[number];

export type MyInvitesResponse = SuccessResponse<MyInvitesOperation>;
export type MyInvite = MyInvitesResponse["items"][number];
export type MyEarningsResponse = SuccessResponse<MyEarningsOperation>;
export type MyPayoutPage = SuccessResponse<MyPayoutsOperation>;
export type MyPayout = MyPayoutPage["items"][number];
export type PayoutDetails = RequestBody<SavePayoutDetailsOperation>;
export type PayoutMethod = PayoutDetails["method"];
export type SavedPayoutDetails = SuccessResponse<PayoutDetailsOperation>;

const referralPaths = {
  me: "/api/v1/me/referrals",
  join: "/api/v1/me/referrals/join",
  invites: "/api/v1/me/referrals/invites",
  earnings: "/api/v1/me/affiliate/earnings",
  payouts: "/api/v1/me/affiliate/payouts",
  cancelPayout: "/api/v1/me/affiliate/payouts/{payout_id}/cancel",
  payoutDetails: "/api/v1/me/affiliate/payout-details",
} as const;

export const referralKeys = {
  all: ["referrals"] as const,
  me: () => [...referralKeys.all, "me"] as const,
  invites: () => [...referralKeys.all, "invites"] as const,
  earnings: () => [...referralKeys.all, "earnings"] as const,
  payouts: () => [...referralKeys.all, "payouts"] as const,
  payoutDetails: () => [...referralKeys.all, "payout-details"] as const,
};

export function getMyReferrals(options?: AuthenticatedRequestOptions): Promise<MyReferralsResponse> {
  return customerRequest<MyReferralsResponse>("GET", referralPaths.me, withAuthCookies(options));
}

/** Creates the student's personal referral link (idempotent). */
export function joinReferrals(options?: AuthenticatedRequestOptions): Promise<MyReferralsResponse> {
  return customerRequest<MyReferralsResponse>("POST", referralPaths.join, withAuthCookies(options));
}

export function getMyInvites(options?: AuthenticatedRequestOptions): Promise<MyInvitesResponse> {
  return customerRequest<MyInvitesResponse>("GET", referralPaths.invites, {
    ...withAuthCookies(options),
    query: { limit: 50 },
  });
}

/** Marketer balance (USD minor units) and whether a payout can be requested. 403 for non-marketers. */
export function getMyEarnings(options?: AuthenticatedRequestOptions): Promise<MyEarningsResponse> {
  return customerRequest<MyEarningsResponse>("GET", referralPaths.earnings, withAuthCookies(options));
}

export function getMyPayouts(options?: AuthenticatedRequestOptions): Promise<MyPayoutPage> {
  return customerRequest<MyPayoutPage>("GET", referralPaths.payouts, { ...withAuthCookies(options), query: { limit: 50 } });
}

/** 409 when a request is already open; 422 `below_minimum`, `above_available` or `missing_details`. */
export function requestPayout(amountMinor: number, options?: AuthenticatedRequestOptions): Promise<MyPayout> {
  const body: RequestBody<RequestPayoutOperation> = { amount_minor: amountMinor };
  return customerRequest<MyPayout>("POST", referralPaths.payouts, { ...withAuthCookies(options), body });
}

export function cancelPayout(payoutId: string, options?: AuthenticatedRequestOptions): Promise<MyPayout> {
  return customerRequest<MyPayout>("POST", referralPaths.cancelPayout, {
    ...withAuthCookies(options),
    path: { payout_id: payoutId },
  });
}

export function getPayoutDetails(options?: AuthenticatedRequestOptions): Promise<SavedPayoutDetails> {
  return customerRequest<SavedPayoutDetails>("GET", referralPaths.payoutDetails, withAuthCookies(options));
}

export function savePayoutDetails(body: PayoutDetails, options?: AuthenticatedRequestOptions): Promise<PayoutDetails> {
  return customerRequest<PayoutDetails>("PUT", referralPaths.payoutDetails, { ...withAuthCookies(options), body });
}

export const referralQueries = {
  me: () => queryOptions({ queryKey: referralKeys.me(), queryFn: ({ signal }) => getMyReferrals({ signal }) }),
  invites: () => queryOptions({ queryKey: referralKeys.invites(), queryFn: ({ signal }) => getMyInvites({ signal }) }),
  earnings: () => queryOptions({ queryKey: referralKeys.earnings(), queryFn: ({ signal }) => getMyEarnings({ signal }) }),
  payouts: () => queryOptions({ queryKey: referralKeys.payouts(), queryFn: ({ signal }) => getMyPayouts({ signal }) }),
  payoutDetails: () =>
    queryOptions({ queryKey: referralKeys.payoutDetails(), queryFn: ({ signal }) => getPayoutDetails({ signal }) }),
};
