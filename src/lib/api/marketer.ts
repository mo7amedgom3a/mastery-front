import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type OverviewOperation = "marketer_overview_api_v1_me_affiliate_overview_get";
type CustomersOperation = "marketer_customers_api_v1_me_affiliate_customers_get";
type SalesOperation = "marketer_sales_api_v1_me_affiliate_sales_get";
type CommissionsOperation = "marketer_commissions_api_v1_me_affiliate_commissions_get";
type CouponsOperation = "marketer_coupons_api_v1_me_affiliate_coupons_get";
type ProfileOperation = "marketer_profile_api_v1_me_affiliate_profile_get";
type SaveProfileOperation = "save_marketer_profile_api_v1_me_affiliate_profile_put";

export type MarketerOverview = SuccessResponse<OverviewOperation>;
export type MarketerDay = MarketerOverview["series"][number];
export type MarketerCustomerPage = SuccessResponse<CustomersOperation>;
export type MarketerCustomer = MarketerCustomerPage["items"][number];
export type MarketerSalePage = SuccessResponse<SalesOperation>;
export type MarketerSale = MarketerSalePage["items"][number];
export type MarketerCommissionPage = SuccessResponse<CommissionsOperation>;
export type MarketerCommission = MarketerCommissionPage["items"][number];
export type MarketerCoupon = SuccessResponse<CouponsOperation>[number];
export type MarketerProfile = SuccessResponse<ProfileOperation>;
export type MarketerProfileInput = RequestBody<SaveProfileOperation>;

const paths = {
  overview: "/api/v1/me/affiliate/overview",
  customers: "/api/v1/me/affiliate/customers",
  sales: "/api/v1/me/affiliate/sales",
  commissions: "/api/v1/me/affiliate/commissions",
  coupons: "/api/v1/me/affiliate/coupons",
  profile: "/api/v1/me/affiliate/profile",
} as const;

export const MARKETER_PAGE_SIZE = 20;

type Page = { offset: number; limit?: number };

export const marketerKeys = {
  all: ["marketer"] as const,
  overview: (days: number) => [...marketerKeys.all, "overview", days] as const,
  customers: (page: Page) => [...marketerKeys.all, "customers", page] as const,
  sales: (page: Page) => [...marketerKeys.all, "sales", page] as const,
  commissions: (page: Page & { status?: string }) => [...marketerKeys.all, "commissions", page] as const,
  coupons: () => [...marketerKeys.all, "coupons"] as const,
  profile: () => [...marketerKeys.all, "profile"] as const,
};

/** Dashboard home. 403 `marketers_only` for customers who are not marketers. */
export function getMarketerOverview(days: number, options?: AuthenticatedRequestOptions): Promise<MarketerOverview> {
  return customerRequest<MarketerOverview>("GET", paths.overview, { ...withAuthCookies(options), query: { days } });
}

function pageQuery({ offset, limit = MARKETER_PAGE_SIZE }: Page) {
  return { offset, limit };
}

export function getMarketerCustomers(page: Page, options?: AuthenticatedRequestOptions): Promise<MarketerCustomerPage> {
  return customerRequest<MarketerCustomerPage>("GET", paths.customers, { ...withAuthCookies(options), query: pageQuery(page) });
}

export function getMarketerSales(page: Page, options?: AuthenticatedRequestOptions): Promise<MarketerSalePage> {
  return customerRequest<MarketerSalePage>("GET", paths.sales, { ...withAuthCookies(options), query: pageQuery(page) });
}

export function getMarketerCommissions(
  page: Page & { status?: string },
  options?: AuthenticatedRequestOptions,
): Promise<MarketerCommissionPage> {
  return customerRequest<MarketerCommissionPage>("GET", paths.commissions, {
    ...withAuthCookies(options),
    query: { ...pageQuery(page), ...(page.status ? { status: page.status } : {}) },
  });
}

export function getMarketerCoupons(options?: AuthenticatedRequestOptions): Promise<MarketerCoupon[]> {
  return customerRequest<MarketerCoupon[]>("GET", paths.coupons, withAuthCookies(options));
}

export function getMarketerProfile(options?: AuthenticatedRequestOptions): Promise<MarketerProfile> {
  return customerRequest<MarketerProfile>("GET", paths.profile, withAuthCookies(options));
}

/** Name, phone, country, city and channels. Email and referral code cannot change. */
export function saveMarketerProfile(body: MarketerProfileInput, options?: AuthenticatedRequestOptions): Promise<MarketerProfile> {
  return customerRequest<MarketerProfile>("PUT", paths.profile, { ...withAuthCookies(options), body });
}

export const marketerQueries = {
  overview: (days: number) =>
    queryOptions({
      queryKey: marketerKeys.overview(days),
      queryFn: ({ signal }) => getMarketerOverview(days, { signal }),
      placeholderData: keepPreviousData,
    }),
  customers: (page: Page) =>
    queryOptions({
      queryKey: marketerKeys.customers(page),
      queryFn: ({ signal }) => getMarketerCustomers(page, { signal }),
      placeholderData: keepPreviousData,
    }),
  sales: (page: Page) =>
    queryOptions({
      queryKey: marketerKeys.sales(page),
      queryFn: ({ signal }) => getMarketerSales(page, { signal }),
      placeholderData: keepPreviousData,
    }),
  commissions: (page: Page & { status?: string }) =>
    queryOptions({
      queryKey: marketerKeys.commissions(page),
      queryFn: ({ signal }) => getMarketerCommissions(page, { signal }),
      placeholderData: keepPreviousData,
    }),
  coupons: () => queryOptions({ queryKey: marketerKeys.coupons(), queryFn: ({ signal }) => getMarketerCoupons({ signal }) }),
  profile: () => queryOptions({ queryKey: marketerKeys.profile(), queryFn: ({ signal }) => getMarketerProfile({ signal }) }),
};
