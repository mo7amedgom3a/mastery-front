"use client";

import { useSelectedLayoutSegment, useRouter } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/lib/auth/store";

import { skipOnboarding } from "../model/skip";
import { ONBOARDING_STEPS, stepIndex } from "../model/steps";
import { OnboardingProgress } from "./progress-bar";

/** The focused onboarding header: logo, "skip for now" and the step progress. */
export function OnboardingChrome() {
  const router = useRouter();
  const segment = useSelectedLayoutSegment();
  const customerId = useAuthStore((state) => state.user?.customer_id ?? null);
  const finished = segment === "start";
  const current = finished ? ONBOARDING_STEPS.length : Math.max(stepIndex(segment), 0);

  const skip = () => {
    if (customerId) skipOnboarding(customerId);
    router.push(routes.studentHome);
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="ma-container flex flex-col gap-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <AppLink href={routes.home} aria-label="ماستري أكاديمي — الصفحة الرئيسية" className="flex shrink-0 items-center">
            <Logo className="w-36 sm:w-44" />
          </AppLink>
          {finished ? null : (
            <Button variant="ghost" size="sm" className="min-h-11" onClick={skip}>
              تخطَّ الآن
            </Button>
          )}
        </div>
        <OnboardingProgress current={current} />
      </div>
    </header>
  );
}
