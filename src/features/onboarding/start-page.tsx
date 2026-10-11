"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { RecommendationGrid } from "@/features/student-dashboard/components/recommendation-grid";

/** After onboarding: starting points picked from the answers, then on to the dashboard. */
export function OnboardingStartPage() {
  return (
    <motion.section
      aria-labelledby="onboarding-start-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[60ch] flex-col gap-3">
          <Sparkles aria-hidden="true" className="size-10 fill-none text-accent" />
          <h1 id="onboarding-start-title" className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">
            نقطة البداية المقترحة لك
          </h1>
          <p className="m-0 leading-7 text-fg-muted">
            اخترنا هذه البرامج بناءً على أهدافك والمهارات التي تريد اكتسابها. يمكنك تعديل إجاباتك في أي وقت من ملفك.
          </p>
        </div>
        <ButtonLink href={routes.studentHome} variant="primary">
          افتح لوحتك
        </ButtonLink>
      </header>
      <RecommendationGrid limit={6} />
    </motion.section>
  );
}
