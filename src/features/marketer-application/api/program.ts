import "server-only";

import type { ProgramPolicy } from "@/features/marketers/model/policy";
import { apiRequest } from "@/lib/api/client";

export type AffiliateProgram = {
  applications_open: boolean;
  commission_percent: string | number;
  cookie_days: number;
  payout_terms: string;
  minimum_payout_minor: number;
};

export const DEFAULT_PROGRAM: AffiliateProgram = {
  applications_open: true,
  commission_percent: "20.00",
  cookie_days: 30,
  payout_terms: "PayPal · NET-15",
  minimum_payout_minor: 0,
};

/** Public programme terms; the defaults when the backend does not answer. */
export function getAffiliateProgram(): Promise<AffiliateProgram> {
  return apiRequest<AffiliateProgram>("GET", "/api/v1/affiliates/program", { next: { revalidate: 300 } }).catch(
    () => DEFAULT_PROGRAM,
  );
}

/** The policy an applicant reads and accepts; null when it cannot be loaded (applying is then blocked). */
export function getAffiliatePolicy(): Promise<ProgramPolicy | null> {
  return apiRequest<ProgramPolicy>("GET", "/api/v1/affiliates/policy", { next: { revalidate: 300 } }).catch(() => null);
}
