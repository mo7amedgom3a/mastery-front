"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { ButtonLink, buttonClass } from "@/components/ui/button";
import { routes } from "@/config/routes";

const readEmail = () => sessionStorage.getItem("mastery-marketer-applied-email") ?? "";
const noEmail = () => "";
const subscribe = () => () => {};

/**
 * After the marketer application is sent. Applications are approved right away: with a Tolt portal
 * configured, Tolt emails the invite and the marketer works from the portal; otherwise they sign in
 * to the built-in `/marketer` dashboard with the same email.
 */
export function ApplyDonePage({ portalUrl }: { portalUrl: string | null }) {
  const email = useSyncExternalStore(subscribe, readEmail, noEmail);
  const sentTo = email ? <> <bdi dir="ltr" className="text-fg">{email}</bdi></> : null;
  return (
    <motion.section
      aria-labelledby="apply-done-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6"
    >
      <CircleCheck aria-hidden="true" className="size-12 fill-none text-accent" />
      <h1 id="apply-done-title" className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">تم قبولك في البرنامج!</h1>
      <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
        شكرًا لانضمامك إلى برنامج المسوقين بالعمولة، حسابك مفعّل الآن.
      </p>
      {portalUrl ? (
        <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
          حسابك جاهز في بوابة المسوّقين، ولا تحتاج إلى تسجيل جديد: افتح البوابة وأدخل البريد نفسه{sentTo} وسيصلك رمز
          تحقق لتسجيل الدخول. من البوابة تحصل على رابطك التسويقي، وتتابع النقرات والمبيعات والعمولات، وتضيف بيانات
          استلام أرباحك.
        </p>
      ) : (
        <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
          ادخل إلى لوحة المسوّق بنفس البريد{sentTo} لتحصل على رابطك التسويقي وتتابع عملاءك ومبيعاتك وعمولاتك.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {portalUrl ? (
          <a href={portalUrl} className={buttonClass({ variant: "primary" })}>فتح بوابة المسوّقين</a>
        ) : (
          <>
            <ButtonLink href={routes.loginThen(routes.marketerDashboard)} variant="primary">دخول لوحة المسوّق</ButtonLink>
            <ButtonLink href={routes.registerThen(routes.marketerDashboard)} variant="soft">إنشاء حساب بنفس البريد</ButtonLink>
          </>
        )}
        <ButtonLink href={routes.marketers} variant="ghost">العودة لبرنامج المسوقين</ButtonLink>
      </div>
    </motion.section>
  );
}
