import { MARKETING_PLATFORMS, platformLinkError } from "@/features/marketers/model/platforms";

import type { ApplyAnswers, ApplyErrors } from "./apply-store";
import type { ApplyStepId } from "./steps";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is missing or wrong on a step; empty when "next" may move on. Mirrors the backend rules. */
export function stepErrors(step: ApplyStepId, a: ApplyAnswers): ApplyErrors {
  const errors: ApplyErrors = {};
  switch (step) {
    case "you":
      if (a.fullName.trim().length < 5) errors.fullName = "اكتب اسمك الثلاثي كاملًا (5 أحرف على الأقل)";
      if (!EMAIL.test(a.email.trim())) errors.email = "اكتب بريدًا إلكترونيًا صحيحًا";
      if (!/^\+?[0-9]{7,20}$/.test(a.phone.replace(/[\s-]/g, ""))) errors.phone = "اكتب رقم جوال صحيحًا مع مفتاح الدولة";
      break;
    case "address":
      if (!a.country.trim()) errors.country = "اختر الدولة";
      if (a.city.trim().length < 2) errors.city = "اختر أو اكتب المدينة";
      if (a.address.trim().length < 3) errors.address = "اكتب العنوان بالتفصيل";
      break;
    case "channels": {
      const linkErrors: Record<string, string> = {};
      for (const platform of MARKETING_PLATFORMS) {
        const answer = a.platforms[platform.key];
        if (!answer?.has) continue;
        const error = platformLinkError(platform, answer.url);
        if (error) linkErrors[platform.key] = error;
      }
      if (Object.keys(linkErrors).length > 0) errors.linkErrors = linkErrors;
      break;
    }
    case "plan":
      if (a.marketingPlan.trim().length < 20) errors.marketingPlan = "اكتب خطتك التسويقية (20 حرفًا على الأقل)";
      break;
    case "policy":
      break;
  }
  return errors;
}

/** The first step with a problem (answers survive a refresh, so an earlier step may be incomplete). */
export function firstInvalidStep(steps: readonly ApplyStepId[], a: ApplyAnswers): ApplyStepId | null {
  return steps.find((step) => Object.keys(stepErrors(step, a)).length > 0) ?? null;
}

/** The `POST /affiliates/applications` body. */
export function applicationBody(a: ApplyAnswers, policyVersion: string) {
  return {
    full_name: a.fullName.trim(),
    email: a.email.trim().toLowerCase(),
    phone: a.phone.replace(/[\s-]/g, ""),
    country: a.country.trim(),
    country_code: a.countryCode ? a.countryCode.toUpperCase() : null,
    city: a.city.trim(),
    po_box: a.poBox.trim() || null,
    postal_code: a.postalCode.trim() || null,
    address: a.address.trim(),
    links: Object.fromEntries(
      MARKETING_PLATFORMS.flatMap((platform) => {
        const answer = a.platforms[platform.key];
        return answer?.has && answer.url.trim() ? [[platform.key, answer.url.trim()]] : [];
      }),
    ),
    has_email_list: a.hasEmailList,
    is_influencer: a.isInfluencer,
    audience_size: a.audienceSize.trim() || null,
    marketing_plan: a.marketingPlan.trim(),
    accept_terms: true,
    policy_version: policyVersion,
  };
}
