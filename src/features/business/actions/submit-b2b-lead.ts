"use server";

import { z } from "zod";

import { b2bCopy } from "../content/b2b";

const leadSchema = z.object({
  company: z.string().trim().min(2, "اكتب اسم الشركة").max(120),
  name: z.string().trim().min(2, "اكتب اسمك").max(120),
  email: z.email("اكتب بريداً إلكترونياً صحيحاً").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, "اكتب رقم هاتف صحيحاً مع رمز الدولة"),
  teamSize: z.enum(b2bCopy.form.teamSizes, "اختر حجم الفريق"),
  field: z.enum(b2bCopy.form.fields, "اختر مجال التدريب"),
});

export type B2BLeadField = keyof z.infer<typeof leadSchema>;

/** Echoed back so the form keeps what the user typed (React resets uncontrolled forms after an action). */
export type B2BLeadValues = Partial<Record<B2BLeadField, string>>;

export type B2BLeadState =
  | { status: "idle"; values?: B2BLeadValues }
  | { status: "invalid"; values: B2BLeadValues; fieldErrors: Partial<Record<B2BLeadField, string>> }
  | { status: "unavailable"; values: B2BLeadValues; message: string };

const FIELDS: readonly B2BLeadField[] = ["company", "name", "email", "phone", "teamSize", "field"];

function readValues(formData: FormData): B2BLeadValues {
  const values: B2BLeadValues = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value.slice(0, 200);
  }
  return values;
}

/**
 * B2B lead capture. Validates on the server; there is no backend endpoint yet, so a valid lead is
 * NOT stored or sent anywhere. TODO(api): POST to the B2B leads endpoint once it exists, then
 * return a `success` state.
 */
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

  return {
    status: "unavailable",
    values,
    message: "استقبال طلبات الشركات عبر الموقع قيد التفعيل حالياً. شكراً لاهتمامك، يرجى المحاولة لاحقاً.",
  };
}
