"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";

const readEmail = () => sessionStorage.getItem("mastery-marketer-applied-email") ?? "";
const noEmail = () => "";
const subscribe = () => () => {};

/** After the marketer application is sent. */
export function ApplyDonePage() {
  const email = useSyncExternalStore(subscribe, readEmail, noEmail);
  return (
    <motion.section
      aria-labelledby="apply-done-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6"
    >
      <CircleCheck aria-hidden="true" className="size-12 fill-none text-accent" />
      <h1 id="apply-done-title" className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">تم استلام طلبك!</h1>
      <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
        شكرًا لاهتمامك ببرنامج المسوقين بالعمولة. نراجع طلبك ونراسلك خلال <strong className="text-fg">48 ساعة</strong>.
      </p>
      <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
        ادخل إلى لوحة المسوّق بنفس البريد{email ? <> <bdi dir="ltr" className="text-fg">{email}</bdi></> : null} لتتابع حالة
        طلبك، وبعد الموافقة أرباحك وعملاءك وطلبات الصرف.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.loginThen(routes.marketerDashboard)} variant="primary">دخول لوحة المسوّق</ButtonLink>
        <ButtonLink href={routes.registerThen(routes.marketerDashboard)} variant="soft">إنشاء حساب بنفس البريد</ButtonLink>
        <ButtonLink href={routes.marketers} variant="ghost">العودة لبرنامج المسوقين</ButtonLink>
      </div>
    </motion.section>
  );
}
