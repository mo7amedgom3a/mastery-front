import "server-only";

import { getLegacyFormsBaseUrl } from "@/config/env";

/**
 * Form submissions that still go to the legacy backend (v1.emasteryacademy.com) rather than the
 * B2C API. The request bodies mirror what the legacy site sends, field for field.
 */

const TIMEOUT_MS = 15_000;

/** `POST /v1/trainerapplication`; the legacy API answers `true`. */
export type TrainerApplicationDto = {
  id: null;
  specialized: string;
  programs: string;
  title: string;
  name: string;
  email: string;
  mobile: string;
  nationality: string;
  /** Booleans as strings, as the legacy API expects. */
  youtube: "true" | "false";
  instagram: "true" | "false";
  facebook: "true" | "false";
  youtubechannel: string | null;
  instagramprofile: string | null;
  facebookpage: string | null;
  country: string;
  city: string;
  /** `YYYY-MM-DD`. */
  birthdate: string;
  educationalLevel: string;
  major: string;
  totalYearsOfExperience: string;
  scopedExperience: string;
  languages: string;
  additionalServices: string;
  personalProgram: string;
  consultancy: boolean;
  cvUrl: string;
  countryCode: 0;
  recorded: boolean;
};

/** `POST /api/b2b/subscribe`; the legacy API answers with the stored company. */
export type B2BSubscriptionDto = {
  id: null;
  status: 1;
  /** Company size as `1-9`; `companyRange` carries the same range as `1~9`. */
  type: string;
  appliedOn: string;
  companyName: string;
  contactName: string;
  companyEmail: string;
  contactPhone: string;
  jobTitle: string;
  companyRange: string;
  country: string;
  city: string;
};

/** True when the legacy API accepted the form; failures are logged, never thrown. */
async function postLegacyForm(path: string, body: unknown): Promise<boolean> {
  const url = `${getLegacyFormsBaseUrl()}${path}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`[legacy-forms] POST ${path} failed with ${response.status}`, await response.text().catch(() => ""));
    }
    return response.ok;
  } catch (error) {
    console.error(`[legacy-forms] POST ${path} failed`, error);
    return false;
  }
}

export function submitTrainerApplication(dto: TrainerApplicationDto): Promise<boolean> {
  return postLegacyForm("/v1/trainerapplication", dto);
}

export function subscribeB2B(dto: B2BSubscriptionDto): Promise<boolean> {
  return postLegacyForm("/api/b2b/subscribe", dto);
}
