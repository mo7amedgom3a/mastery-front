import { z } from "zod";

/**
 * What the sign-in and registration forms send, checked in the browser and again by the
 * `/api/auth/*` route handlers. Limits mirror the backend's (`auth/presentation/schemas.py`).
 */
export const loginSchema = z.object({
  loginName: z.string().trim().min(3, "أدخل بريدك الإلكتروني.").max(256, "البريد الإلكتروني طويل جداً."),
});

export const verifySchema = z.object({
  code: z.string().trim().min(4, "أدخل رمز التحقق كما وصلك.").max(20, "رمز التحقق غير صحيح."),
});

export const registerSchema = z
  .object({
    fullname: z.string().trim().min(1, "أدخل اسمك الكامل.").max(300, "الاسم طويل جداً."),
    email: z.email("أدخل بريداً إلكترونياً صحيحاً.").max(256, "البريد الإلكتروني طويل جداً."),
    // Optional; an empty field is sent as null.
    phone: z
      .string()
      .trim()
      .max(80, "رقم الهاتف طويل جداً.")
      .regex(/^[+\d\s()-]*$/, "أدخل رقم هاتف صحيحاً.")
      .transform((value) => value || null)
      .nullable(),
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل.").max(200, "كلمة المرور طويلة جداً."),
    repassword: z.string(),
    acceptterms: z.literal(true, "يجب الموافقة على الشروط والأحكام."),
  })
  .refine((value) => value.password === value.repassword, {
    path: ["repassword"],
    message: "كلمتا المرور غير متطابقتين.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterField = keyof RegisterInput;
