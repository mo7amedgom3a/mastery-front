import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { SuccessResponse } from "@/lib/api/operation-types";

type MyCertificatesOperation = "my_certificates_api_v1_me_certificates_get";
type MyCertificateOperation = "my_certificate_api_v1_me_certificates__certificate_id__get";
type VerifyOperation = "verify_certificate_api_v1_certificates_verify__code__get";
type AddonOffersOperation = "certificate_addon_offers_api_v1_catalog_certificate_addons_get";

export type MyCertificatesResponse = SuccessResponse<MyCertificatesOperation>;
export type MyCertificate = SuccessResponse<MyCertificateOperation>;
export type CertificateVerification = SuccessResponse<VerifyOperation>;
export type AddonOffersResponse = SuccessResponse<AddonOffersOperation>;
export type AddonOffer = AddonOffersResponse["items"][number]["addons"][number];

const certificatePaths = {
  mine: "/api/v1/me/certificates",
  one: "/api/v1/me/certificates/{certificate_id}",
  name: "/api/v1/me/certificate-name",
  verify: "/api/v1/certificates/verify/{code}",
  addonOffers: "/api/v1/catalog/certificate-addons",
} as const;

export const certificateKeys = {
  all: ["certificates"] as const,
  mine: () => [...certificateKeys.all, "mine"] as const,
  one: (id: string) => [...certificateKeys.all, "one", id] as const,
  verify: (code: string) => [...certificateKeys.all, "verify", code] as const,
};

export function listMyCertificates(options?: AuthenticatedRequestOptions): Promise<MyCertificatesResponse> {
  return customerRequest<MyCertificatesResponse>("GET", certificatePaths.mine, withAuthCookies(options));
}

export function getMyCertificate(certificateId: string, options?: AuthenticatedRequestOptions): Promise<MyCertificate> {
  return customerRequest<MyCertificate>("GET", certificatePaths.one, {
    ...withAuthCookies(options),
    path: { certificate_id: certificateId },
  });
}

/** Saves the English name printed on certificates; certificates waiting for it are issued. */
export function setMyCertificateName(name: string, options?: AuthenticatedRequestOptions): Promise<MyCertificatesResponse> {
  return customerRequest<MyCertificatesResponse>("PUT", certificatePaths.name, {
    ...withAuthCookies(options),
    body: { name },
  });
}

/** Public check of a certificate by its ID No; any case, dashes optional. */
export function verifyCertificate(code: string, options?: ApiRequestOptions): Promise<CertificateVerification> {
  const viaApp = typeof window !== "undefined" ? { sameOrigin: true as const } : {};
  return apiRequest<CertificateVerification>("GET", certificatePaths.verify, {
    ...options,
    ...viaApp,
    path: { code },
  });
}

/** Certificate add-ons offered per product slug, with prices (server-side guest cart previews). */
export function getAddonOffers(slugs: string[], options?: ApiRequestOptions): Promise<AddonOffersResponse> {
  return apiRequest<AddonOffersResponse>("GET", certificatePaths.addonOffers, { ...options, query: { slugs } });
}

/** Same-origin URL of a certificate PDF (`download` asks for an attachment). */
export function certificatePdfUrl(certificateId: string, download = false): string {
  return `/api/certificates/${encodeURIComponent(certificateId)}/pdf${download ? "?download=1" : ""}`;
}

export const certificateQueries = {
  mine: () =>
    queryOptions({ queryKey: certificateKeys.mine(), queryFn: ({ signal }) => listMyCertificates({ signal }) }),
  one: (id: string) =>
    queryOptions({ queryKey: certificateKeys.one(id), queryFn: ({ signal }) => getMyCertificate(id, { signal }) }),
};

/** Same-origin URL of the signed-in customer's certificate image (PNG). */
export function certificateImageUrl(certificateId: string, download = false): string {
  return `/api/certificates/${encodeURIComponent(certificateId)}/image${download ? "?download=1" : ""}`;
}

/** Same-origin URL of a valid certificate's public image, by its ID No. */
export function publicCertificateImageUrl(code: string): string {
  return `/api/certificates/verify/${encodeURIComponent(code)}/image`;
}
