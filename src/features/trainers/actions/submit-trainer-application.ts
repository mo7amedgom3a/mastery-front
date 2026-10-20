"use server";

import { z } from "zod";

import { submitTrainerApplication as postTrainerApplication } from "@/lib/api/public-requests";

import { trainerFormCopy, trainerFormOptions } from "../content/copy";

const text = (message: string, max = 120) => z.string().trim().min(2, message).max(max);
/** Optional free text: empty stays empty. */
const optional = (max: number) => z.string().trim().max(max, `الحد الأقصى ${max} حرف`);

const MIN_AGE = 18;

function isAdultBirthdate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const adultFrom = Date.UTC(now.getUTCFullYear() - MIN_AGE, now.getUTCMonth(), now.getUTCDate());
  return date.getUTCFullYear() >= 1920 && date.getTime() <= adultFrom;
}

const textSchema = z.object({
  title: z.enum(trainerFormOptions.titles, "اختر اللقب"),
  name: text("اكتب اسمك الكامل"),
  email: z.email("اكتب بريداً إلكترونياً صحيحاً").max(200),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, "اكتب رقم هاتف صحيحاً مع رمز الدولة"),
  nationality: text("اكتب الجنسية", 80),
  country: text("اكتب دولة الإقامة", 80),
  city: text("اكتب المدينة", 80),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "اختر تاريخ الميلاد")
    .refine(isAdultBirthdate, `يجب ألا يقل العمر عن ${MIN_AGE} عاماً`),
  educationalLevel: z.enum(trainerFormOptions.educationalLevels, "اختر المؤهل العلمي"),
  major: text("اكتب التخصص الأكاديمي"),
  totalYearsOfExperience: z.enum(trainerFormOptions.experienceYears, "اختر سنوات الخبرة"),
  scopedExperience: z.enum(trainerFormOptions.sectors, "اختر قطاع الخبرة"),
  specialized: text("اختر مجال التخصص"),
  programs: text("اكتب عنوان البرنامج أو البرامج المقترحة", 300),
  personalProgram: z.string().trim().min(20, "صف برنامجك في 20 حرفاً على الأقل").max(3000),
  additionalServices: optional(1000),
  youtubechannel: optional(300),
  instagramprofile: optional(300),
  facebookpage: optional(300),
  cvUrl: z.union([z.literal(""), z.url("اكتب رابطاً صحيحاً يبدأ بـ https://").max(500).refine((url) => url.startsWith("https://"), "استخدم رابط https")]),
});

export type TrainerTextField = keyof z.infer<typeof textSchema>;
const CHECK_FIELDS = ["youtube", "instagram", "facebook", "recorded", "consultancy"] as const;
export type TrainerCheckField = (typeof CHECK_FIELDS)[number];
export type TrainerField = TrainerTextField | TrainerCheckField | "languages" | "categoryIds" | "skillIds";

/** Echoed back so the form keeps what the user typed (React resets uncontrolled forms after an action). */
export type TrainerValues = {
  text: Partial<Record<TrainerTextField, string>>;
  checks: Partial<Record<TrainerCheckField, boolean>>;
  languages: string[];
  categoryIds: string[];
  skillIds: string[];
  cvAttachmentId: string;
  portfolioAttachmentIds: string[];
};

export type TrainerApplicationState =
  | { status: "idle"; values?: TrainerValues }
  | { status: "invalid"; values: TrainerValues; fieldErrors: Partial<Record<TrainerField, string>> }
  | { status: "error"; values: TrainerValues; message: string }
  | { status: "success" };

const TEXT_FIELDS = Object.keys(textSchema.shape) as TrainerTextField[];
const LANGUAGES: readonly string[] = trainerFormOptions.languages;

function readValues(formData: FormData): TrainerValues {
  const values: TrainerValues = { text: {}, checks: {}, languages: [], categoryIds: [], skillIds: [], cvAttachmentId: "", portfolioAttachmentIds: [] };
  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values.text[field] = value.slice(0, 3000);
  }
  for (const field of CHECK_FIELDS) values.checks[field] = formData.get(field) === "on";
  values.languages = formData.getAll("languages").filter((value): value is string => typeof value === "string" && LANGUAGES.includes(value));
  values.categoryIds = formData.getAll("categoryIds").filter((value): value is string => typeof value === "string");
  values.skillIds = formData.getAll("skillIds").filter((value): value is string => typeof value === "string");
  values.cvAttachmentId = String(formData.get("cvAttachmentId") ?? "");
  values.portfolioAttachmentIds = formData.getAll("portfolioAttachmentIds").filter((value): value is string => typeof value === "string");
  return values;
}

const link = (enabled: boolean | undefined, value: string) => (enabled && value ? value : null);

/** Trainer application: validated here, then stored by the B2C API. */
export async function submitTrainerApplication(
  _previous: TrainerApplicationState,
  formData: FormData,
): Promise<TrainerApplicationState> {
  const values = readValues(formData);
  const parsed = textSchema.safeParse(values.text);
  const fieldErrors: Partial<Record<TrainerField, string>> = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as TrainerTextField;
      fieldErrors[field] ??= issue.message;
    }
  }
  if (values.languages.length === 0) fieldErrors.languages = "اختر لغة واحدة على الأقل";
  if (values.categoryIds.length === 0) fieldErrors.categoryIds = "اختر مجالاً واحداً على الأقل";
  if (values.skillIds.length === 0) fieldErrors.skillIds = "اختر مهارة واحدة على الأقل";
  if (!values.cvAttachmentId && !values.text.cvUrl) fieldErrors.cvUrl = "أرفق سيرة ذاتية أو أدخل رابطها";

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", values, fieldErrors };
  }

  const form = parsed.data!;
  const { checks } = values;
  const accepted = await postTrainerApplication({
    specialized: form.specialized,
    programs: form.programs,
    title: form.title,
    name: form.name,
    email: form.email,
    mobile: form.mobile.replace(/[\s-]/g, ""),
    nationality: form.nationality,
    youtube: Boolean(checks.youtube),
    instagram: Boolean(checks.instagram),
    facebook: Boolean(checks.facebook),
    youtubechannel: link(checks.youtube, form.youtubechannel),
    instagramprofile: link(checks.instagram, form.instagramprofile),
    facebookpage: link(checks.facebook, form.facebookpage),
    country: form.country,
    city: form.city,
    birthdate: form.birthdate,
    educationalLevel: form.educationalLevel,
    major: form.major,
    totalYearsOfExperience: form.totalYearsOfExperience,
    scopedExperience: form.scopedExperience,
    languages: values.languages.join("، "),
    additionalServices: form.additionalServices,
    personalProgram: form.personalProgram,
    consultancy: Boolean(checks.consultancy),
    cvUrl: form.cvUrl,
    recorded: Boolean(checks.recorded),
    categoryIds: values.categoryIds,
    skillIds: values.skillIds,
    cvAttachmentId: values.cvAttachmentId || null,
    portfolioAttachmentIds: values.portfolioAttachmentIds,
  });

  return accepted ? { status: "success" } : { status: "error", values, message: trainerFormCopy.error };
}
