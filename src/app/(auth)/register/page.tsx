import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { AuthPage } from "@/features/auth/components/auth-page";
import { RegisterForm } from "@/features/auth/components/register-form";
import { safeNextPath } from "@/features/auth/model/next-path";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك في ماستري أكاديمي لتجد مشترياتك وبرامجك في أي وقت ومن أي جهاز.",
  // A form, not content: nothing here for a search index.
  robots: { index: false, follow: false },
};

export default async function RegisterRoute({ searchParams }: PageProps<"/register">) {
  const next = safeNextPath((await searchParams).next);

  return (
    <AuthPage
      id="register-title"
      title="إنشاء حساب"
      lead="حساب واحد لمشترياتك وبرامجك وقائمة مفضلاتك، تجدها في أي وقت ومن أي جهاز."
      alternative={{
        question: "لديك حساب؟",
        label: "سجّل الدخول",
        href: next === "/" ? routes.login : routes.loginThen(next),
      }}
    >
      <RegisterForm next={next} />
    </AuthPage>
  );
}
