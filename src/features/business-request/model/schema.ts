import { z } from "zod";

import { companyRanges } from "@/features/business/content/b2b";

import { departments, industries, platforms, trainingGoals, trainingTypes, valuesOf } from "./options";
import type { RequestAnswers, RequestErrors, RequestField } from "./request-store";
import { REQUEST_STEPS, type RequestStepId } from "./steps";

const text = (message: string, max = 120) => z.string().trim().min(2, message).max(max);
const list = <T extends string>(values: [T, ...T[]], message: string) => z.array(z.enum(values)).min(1, message);

export const DISALLOWED_COMPANY_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
  "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "proton.me", "protonmail.com",
  "zoho.com", "mail.com", "gmx.com", "gmx.net",
  "yandex.com", "yandex.ru", "mail.ru", "inbox.ru",
]);

/** Enough to save a follow-up lead while the rest of the first step is unfinished. */
export const draftLeadSchema = z.object({
  companyName: text("اكتب اسم الشركة", 250),
  contactName: text("اكتب اسمك", 250),
  companyEmail: z.email().max(320).refine(isCorporateEmail),
  contactPhone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/)
    .refine((phone) => phone.replace(/\D/g, "").length >= 9),
});

export function isCorporateEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return Boolean(domain && !DISALLOWED_COMPANY_EMAIL_DOMAINS.has(domain));
}

/** The answers the API accepts; used on every "next" (per step) and again in the Server Action. */
const requestFieldsSchema = z.object({
    companyName: text("اكتب اسم الشركة", 250),
    industry: z.enum(valuesOf(industries), "اختر مجال عمل الشركة"),
    industryOther: z.string().trim().max(120),
    companyRange: z.enum(
      companyRanges.map((range) => range.value),
      "اختر حجم الشركة",
    ),
    websiteUrl: z.string().trim().refine(
      (url) => !url || (URL.canParse(url) && new URL(url).protocol === "https:"),
      "أدخل رابط موقع صحيحاً يبدأ بـ https://",
    ),
    countryCode: z.string("اختر الدولة").regex(/^[A-Z]{2}$/, "اختر الدولة"),
    countryName: text("اختر الدولة", 100),
    city: text("اختر المدينة", 100),
    teamSize: z.coerce.number<string>("حدّد عدد الموظفين").int("اكتب رقماً صحيحاً").min(1, "حدّد عدد الموظفين").max(1_000_000),
    trainingTypes: list(valuesOf(trainingTypes), "اختر نوع تدريب واحداً على الأقل"),
    trainingGoals: list(valuesOf(trainingGoals), "اختر هدفاً واحداً على الأقل"),
    otherTrainingGoal: z.string().trim().max(200),
    departments: list(valuesOf(departments), "اختر قسماً واحداً على الأقل"),
    otherDepartment: z.string().trim().max(200),
    hasTrainingBudget: z.union([z.boolean(), z.literal("maybe")]).nullable(),
    hasInternalLms: z.boolean("اختر نعم أو لا"),
    usedPlatformBefore: z.boolean("اختر نعم أو لا"),
    previousPlatforms: z.array(z.enum(valuesOf(platforms))),
    otherPlatform: z.string().trim().max(200),
    categoryIds: z.array(z.string()).max(20, "اختر 20 مجالاً على الأكثر"),
    otherCategorySelected: z.boolean(),
    otherCategory: z.string().trim().max(200),
    skillIds: z.array(z.string()).max(30, "اختر 30 مهارة على الأكثر"),
    otherSkillSelected: z.boolean(),
    otherSkill: z.string().trim().max(200),
    summary: z.string().trim().max(3000),
    contactName: text("اكتب اسمك", 250),
    jobTitle: text("اكتب مسمّاك الوظيفي"),
    companyEmail: z
      .email("اكتب بريداً إلكترونياً صحيحاً")
      .max(320)
      .refine(isCorporateEmail, "يرجى استخدام البريد الإلكتروني الرسمي للشركة (لا يُقبل بريد مجاني مثل Gmail أو Yahoo)"),
    contactPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{7,20}$/, "اكتب رقم هاتف صحيحاً مع رمز الدولة"),
  });

type ConditionalAnswers = Pick<RequestAnswers,
  "industry" | "industryOther" | "trainingGoals" | "otherTrainingGoal" | "departments" | "otherDepartment" |
  "usedPlatformBefore" | "previousPlatforms" | "otherPlatform" | "categoryIds" | "otherCategorySelected" |
  "otherCategory" | "skillIds" | "otherSkillSelected" | "otherSkill"
>;

function conditionalIssues(answers: ConditionalAnswers): Array<{ field: RequestField; message: string }> {
  const issues: Array<{ field: RequestField; message: string }> = [];
  const require = (field: RequestField, message: string) => issues.push({ field, message });
  if (answers.industry === "other" && answers.industryOther.trim().length < 2) require("industryOther", "اكتب مجال عمل الشركة");
  if (answers.trainingGoals.includes("other") && answers.otherTrainingGoal.trim().length < 2) require("otherTrainingGoal", "اكتب الهدف الآخر من التدريب");
  if (answers.departments.includes("other") && answers.otherDepartment.trim().length < 2) require("otherDepartment", "اكتب أسماء الأقسام");
  if (answers.usedPlatformBefore && answers.previousPlatforms.length === 0) require("previousPlatforms", "اختر منصة واحدة على الأقل");
  if (answers.usedPlatformBefore && answers.previousPlatforms.includes("other") && answers.otherPlatform.trim().length < 2) {
    require("otherPlatform", "اكتب اسم المنصة");
  }
  if (!answers.categoryIds.length && !answers.otherCategorySelected) require("categoryIds", "اختر مجالاً واحداً على الأقل");
  if (answers.otherCategorySelected && answers.otherCategory.trim().length < 2) require("otherCategory", "اكتب المجال الآخر");
  if (!answers.skillIds.length && !answers.otherSkillSelected) require("skillIds", "اختر مهارة واحدة على الأقل");
  if (answers.otherSkillSelected && answers.otherSkill.trim().length < 2) require("otherSkill", "اكتب المهارة الأخرى");
  return issues;
}

export const requestSchema = requestFieldsSchema.superRefine((answers, context) => {
  for (const issue of conditionalIssues(answers)) {
    context.addIssue({ code: "custom", path: [issue.field], message: issue.message });
  }
});

/** Which answers each step asks for, so a step only reports its own errors. */
export const STEP_FIELDS: Record<RequestStepId, readonly RequestField[]> = {
  company: ["companyName", "contactName", "jobTitle", "companyEmail", "contactPhone", "industry", "industryOther", "companyRange", "websiteUrl", "countryCode", "countryName", "city"],
  training: ["trainingTypes", "trainingGoals", "otherTrainingGoal", "teamSize"],
  departments: ["departments", "otherDepartment"],
  budget: ["hasTrainingBudget", "hasInternalLms", "usedPlatformBefore", "previousPlatforms", "otherPlatform"],
  needs: ["categoryIds", "otherCategory", "skillIds", "otherSkill", "summary"],
};

/** First message per field. */
export function errorsOf(issues: readonly z.core.$ZodIssue[]): RequestErrors {
  const errors: RequestErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as RequestField;
    errors[field] ??= issue.message;
  }
  return errors;
}

/** Errors of one step's answers (other steps are ignored). */
export function stepErrors(step: RequestStepId, answers: RequestAnswers): RequestErrors {
  const parsed = requestFieldsSchema.safeParse(answers);
  const all = parsed.success ? {} : errorsOf(parsed.error.issues);
  for (const issue of conditionalIssues(answers)) all[issue.field] ??= issue.message;
  return Object.fromEntries(STEP_FIELDS[step].filter((field) => all[field]).map((field) => [field, all[field]]));
}

/** The first step that has one of `errors`, so a rejected submit can send the user back to it. */
export function firstStepWith(errors: RequestErrors): RequestStepId | null {
  return REQUEST_STEPS.find((step) => STEP_FIELDS[step.id].some((field) => errors[field]))?.id ?? null;
}
