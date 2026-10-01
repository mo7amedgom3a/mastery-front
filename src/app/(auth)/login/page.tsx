import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { AuthPage } from "@/features/auth/components/auth-page";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/model/next-path";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول إلى حسابك في ماستري أكاديمي برمز تحقق يصلك على بريدك الإلكتروني.",
  // A form, not content: nothing here for a search index.
  robots: { index: false, follow: false },
};

export default async function LoginRoute({ searchParams }: PageProps<"/login">) {
  const next = safeNextPath((await searchParams).next);

  return (
    <AuthPage
      id="login-title"
      title="تسجيل الدخول"
      lead="أدخل بريدك الإلكتروني وسنرسل إليك رمز تحقق؛ لا حاجة إلى كلمة المرور."
      alternative={{
        question: "ليس لديك حساب؟",
        label: "أنشئ حساباً",
        href: next === "/" ? routes.register : routes.registerThen(next),
      }}
    >
      <LoginForm next={next} />
    </AuthPage>
  );
}
