import { queryOptions } from "@tanstack/react-query";

import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { SuccessResponse } from "@/lib/api/operation-types";

type MyReferralsOperation = "my_referrals_api_v1_me_referrals_get";
type MyInvitesOperation = "my_invites_api_v1_me_referrals_invites_get";

export type MyReferralsResponse = SuccessResponse<MyReferralsOperation>;
export type PartnerConversion = NonNullable<MyReferralsResponse["conversions"]>[number];

export type MyInvitesResponse = SuccessResponse<MyInvitesOperation>;
export type MyInvite = MyInvitesResponse["items"][number];

const referralPaths = {
  me: "/api/v1/me/referrals",
  join: "/api/v1/me/referrals/join",
  invites: "/api/v1/me/referrals/invites",
} as const;

export const referralKeys = {
  all: ["referrals"] as const,
  me: () => [...referralKeys.all, "me"] as const,
  invites: () => [...referralKeys.all, "invites"] as const,
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

export const referralQueries = {
  me: () => queryOptions({ queryKey: referralKeys.me(), queryFn: ({ signal }) => getMyReferrals({ signal }) }),
  invites: () => queryOptions({ queryKey: referralKeys.invites(), queryFn: ({ signal }) => getMyInvites({ signal }) }),
};
