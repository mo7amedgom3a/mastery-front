"use server";

import { b2bFormCopy } from "@/features/business/content/b2b";
import { submitCompanyTrainingRequest } from "@/lib/api/public-requests";

import { errorsOf, requestSchema } from "../model/schema";
import type { RequestAnswers, RequestErrors } from "../model/request-store";

export type SubmitRequestResult =
  | { status: "success" }
  | { status: "invalid"; errors: RequestErrors }
  | { status: "error"; message: string };

/** Company training request: validated again here, then stored by the B2C API. */
export async function submitCompanyRequest(answers: RequestAnswers): Promise<SubmitRequestResult> {
  const parsed = requestSchema.safeParse(answers);
  if (!parsed.success) return { status: "invalid", errors: errorsOf(parsed.error.issues) };

  const request = parsed.data;
  const usedPlatform = request.usedPlatformBefore;
  const accepted = await submitCompanyTrainingRequest({
    companyName: request.companyName,
    contactName: request.contactName,
    companyEmail: request.companyEmail,
    contactPhone: request.contactPhone.replace(/[\s-]/g, ""),
    jobTitle: request.jobTitle,
    companyRange: request.companyRange,
    country: request.countryName,
    city: request.city,
    industry: request.industry === "other" ? request.industryOther : request.industry,
    websiteUrl: request.websiteUrl,
    teamSize: request.teamSize,
    trainingTypes: request.trainingTypes,
    trainingGoals: request.trainingGoals,
    departments: request.departments,
    otherDepartment: request.departments.includes("other") ? request.otherDepartment : null,
    hasTrainingBudget: request.hasTrainingBudget,
    usedPlatformBefore: usedPlatform,
    previousPlatforms: usedPlatform ? request.previousPlatforms : [],
    otherPlatform: usedPlatform && request.previousPlatforms.includes("other") ? request.otherPlatform : null,
    categoryIds: request.categoryIds,
    skillIds: request.skillIds,
    summary: request.summary,
  });

  return accepted ? { status: "success" } : { status: "error", message: b2bFormCopy.error };
}
