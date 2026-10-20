"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { b2bFormCopy } from "@/features/business/content/b2b";

/** After the company request is sent. */
export function RequestDonePage() {
  return (
    <motion.section
      aria-labelledby="request-done-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6"
    >
      <CircleCheck aria-hidden="true" className="size-12 fill-none text-accent" />
      <h1 id="request-done-title" className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">
        {b2bFormCopy.success.title}
      </h1>
      <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">{b2bFormCopy.success.body}</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.business} variant="primary">
          العودة إلى حلول الشركات
        </ButtonLink>
        <ButtonLink href={routes.home} variant="ghost">
          الصفحة الرئيسية
        </ButtonLink>
      </div>
    </motion.section>
  );
}
