"use server";

import { z } from "zod";

import { subscribeB2B } from "@/lib/api/legacy-forms";

import { b2bFormCopy, companyRanges } from "../content/b2b";

const text = (message: string, max = 120) => z.string().trim().min(2, message).max(max);

const leadSchema = z.object({
  companyName: text("اكتب اسم الشركة"),
  contactName: text("اكتب اسمك"),
  jobTitle: text("اكتب مسمّاك الوظيفي"),
  companyEmail: z.email("اكتب بريداً إلكترونياً صحيحاً").max(200),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, "اكتب رقم هاتف صحيحاً مع رمز الدولة"),
  companyRange: z.enum(
    companyRanges.map((range) => range.value),
    "اختر حجم الشركة",
  ),
  country: text("اكتب الدولة", 80),
  city: text("اكتب المدينة", 80),
});

export type B2BLeadField = keyof z.infer<typeof leadSchema>;

/** Echoed back so the form keeps what the user typed (React resets uncontrolled forms after an action). */
export type B2BLeadValues = Partial<Record<B2BLeadField, string>>;

export type B2BLeadState =
  | { status: "idle"; values?: B2BLeadValues }
  | { status: "invalid"; values: B2BLeadValues; fieldErrors: Partial<Record<B2BLeadField, string>> }
  | { status: "error"; values: B2BLeadValues; message: string }
  | { status: "success" };

const FIELDS: readonly B2BLeadField[] = [
  "companyName",
  "contactName",
  "jobTitle",
  "companyEmail",
  "contactPhone",
  "companyRange",
  "country",
  "city",
];

function readValues(formData: FormData): B2BLeadValues {
  const values: B2BLeadValues = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value.slice(0, 200);
  }
  return values;
}

/** Company training request: validated here, then posted to the legacy B2B endpoint. */
export async function submitB2BLead(_previous: B2BLeadState, formData: FormData): Promise<B2BLeadState> {
  const values = readValues(formData);
  const parsed = leadSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<B2BLeadField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as B2BLeadField;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "invalid", values, fieldErrors };
  }

  const lead = parsed.data;
  const range = companyRanges.find((item) => item.value === lead.companyRange) ?? companyRanges[0];
  const accepted = await subscribeB2B({
    id: null,
    status: 1,
    type: range.type,
    appliedOn: new Date().toISOString(),
    companyName: lead.companyName,
    contactName: lead.contactName,
    companyEmail: lead.companyEmail,
    contactPhone: lead.contactPhone.replace(/[\s-]/g, ""),
    jobTitle: lead.jobTitle,
    companyRange: range.value,
    country: lead.country,
    city: lead.city,
  });

  return accepted ? { status: "success" } : { status: "error", values, message: b2bFormCopy.error };
}
