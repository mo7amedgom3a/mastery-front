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

export function isCorporateEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return Boolean(domain && !DISALLOWED_COMPANY_EMAIL_DOMAINS.has(domain));
}

/** The answers the API accepts; used on every "next" (per step) and again in the Server Action. */
export const requestSchema = z
  .object({
    companyName: text("اكتب اسم الشركة", 250),
    industry: z.enum(valuesOf(industries), "اختر مجال عمل الشركة"),
    industryOther: z.string().trim().max(120),
    companyRange: z.enum(
      companyRanges.map((range) => range.value),
      "اختر حجم الشركة",
    ),
    websiteUrl: z
      .string()
      .trim()
      .pipe(z.url("أدخل رابط موقع صحيحاً"))
      .refine((url) => url.startsWith("https://"), "استخدم رابطاً يبدأ بـ https://"),
    countryCode: z.string("اختر الدولة").regex(/^[A-Z]{2}$/, "اختر الدولة"),
    countryName: text("اختر الدولة", 100),
    city: text("اختر المدينة", 100),
    teamSize: z.coerce.number<string>("حدّد عدد الموظفين").int("اكتب رقماً صحيحاً").min(1, "حدّد عدد الموظفين").max(1_000_000),
    trainingTypes: list(valuesOf(trainingTypes), "اختر نوع تدريب واحداً على الأقل"),
    trainingGoals: list(valuesOf(trainingGoals), "اختر هدفاً واحداً على الأقل"),
    departments: list(valuesOf(departments), "اختر قسماً واحداً على الأقل"),
    otherDepartment: z.string().trim().max(200),
    hasTrainingBudget: z.boolean().nullable(),
    usedPlatformBefore: z.boolean("اختر نعم أو لا"),
    previousPlatforms: z.array(z.enum(valuesOf(platforms))),
    otherPlatform: z.string().trim().max(200),
    categoryIds: z.array(z.string()).min(1, "اختر مجالاً واحداً على الأقل").max(20, "اختر 20 مجالاً على الأكثر"),
    skillIds: z.array(z.string()).min(1, "اختر مهارة واحدة على الأقل").max(30, "اختر 30 مهارة على الأكثر"),
    summary: z.string().trim().min(20, "اكتب ملخصاً من 20 حرفاً على الأقل").max(3000),
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
  })
  .superRefine((answers, context) => {
    const require = (path: RequestField, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (answers.industry === "other" && answers.industryOther.length < 2) require("industryOther", "اكتب مجال عمل الشركة");
    if (answers.departments.includes("other") && answers.otherDepartment.length < 2) require("otherDepartment", "اكتب أسماء الأقسام");
    if (answers.usedPlatformBefore && answers.previousPlatforms.length === 0) require("previousPlatforms", "اختر منصة واحدة على الأقل");
    if (answers.usedPlatformBefore && answers.previousPlatforms.includes("other") && answers.otherPlatform.length < 2) {
      require("otherPlatform", "اكتب اسم المنصة");
    }
  });

/** Which answers each step asks for, so a step only reports its own errors. */
export const STEP_FIELDS: Record<RequestStepId, readonly RequestField[]> = {
  company: ["companyName", "industry", "industryOther", "companyRange", "websiteUrl", "countryCode", "countryName", "city"],
  training: ["trainingTypes", "trainingGoals", "teamSize"],
  departments: ["departments", "otherDepartment"],
  budget: ["hasTrainingBudget", "usedPlatformBefore", "previousPlatforms", "otherPlatform"],
  needs: ["categoryIds", "skillIds", "summary"],
  contact: ["contactName", "jobTitle", "companyEmail", "contactPhone"],
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
  const parsed = requestSchema.safeParse(answers);
  if (parsed.success) return {};
  const all = errorsOf(parsed.error.issues);
  return Object.fromEntries(STEP_FIELDS[step].filter((field) => all[field]).map((field) => [field, all[field]]));
}

/** The first step that has one of `errors`, so a rejected submit can send the user back to it. */
export function firstStepWith(errors: RequestErrors): RequestStepId | null {
  return REQUEST_STEPS.find((step) => STEP_FIELDS[step.id].some((field) => errors[field]))?.id ?? null;
}
