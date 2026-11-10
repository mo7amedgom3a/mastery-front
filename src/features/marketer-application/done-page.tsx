"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";

const readEmail = () => sessionStorage.getItem("mastery-marketer-applied-email") ?? "";
const noEmail = () => "";
const subscribe = () => () => {};

/**
 * After the marketer application is sent. Applications are approved right away: the marketer signs in
 * to the `/marketer` dashboard with the same email, gets their link and connects Stripe to be paid.
 */
export function ApplyDonePage() {
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
      <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
        ادخل إلى لوحة المسوّق بنفس البريد{sentTo} لتحصل على رابطك التسويقي وتتابع عملاءك ومبيعاتك وعمولاتك، ثم اربط
        حسابك على Stripe من «الأرباح والتحويلات» لتصلك أرباحك تلقائيًا في أول كل شهر.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.loginThen(routes.marketerDashboard)} variant="primary">دخول لوحة المسوّق</ButtonLink>
        <ButtonLink href={routes.registerThen(routes.marketerDashboard)} variant="soft">إنشاء حساب بنفس البريد</ButtonLink>
        <ButtonLink href={routes.marketers} variant="ghost">العودة لبرنامج المسوقين</ButtonLink>
      </div>
    </motion.section>
  );
}
