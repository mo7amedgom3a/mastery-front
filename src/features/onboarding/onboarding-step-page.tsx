"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogQueries } from "@/lib/api/catalog";

import { useOnboardingHydrated } from "./model/onboarding-store";
import type { OnboardingStepId } from "./model/steps";
import { GoalStep } from "./steps/goal-step";
import { LevelStep } from "./steps/level-step";
import { PreferencesStep } from "./steps/preferences-step";
import { SkillsStep } from "./steps/skills-step";
import { StrengthsStep } from "./steps/strengths-step";

/** One onboarding step, once the saved answers and the choices (skills, topics, types) are loaded. */
export function OnboardingStepPage({ step }: { step: OnboardingStepId }) {
  const hydrated = useOnboardingHydrated();
  const options = useQuery(catalogQueries.onboardingOptions());

  if (options.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4">
        <div className="ma-alert ma-alert--warning w-full" role="alert">
          <TriangleAlert aria-hidden="true" className="fill-none" />
          <div>
            <p className="ma-alert__title">تعذّر تحميل الخيارات</p>
            <p className="ma-alert__text">تحقّق من اتصالك ثم حاول مجدداً.</p>
          </div>
        </div>
        <Button variant="soft" onClick={() => void options.refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!hydrated || options.isPending) {
    return (
      <div role="status" className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const skills = options.data.skills ?? [];
  switch (step) {
    case "goal":
      return <GoalStep skills={skills} />;
    case "skills":
      return <SkillsStep skills={skills} />;
    case "strengths":
      return <StrengthsStep skills={skills} />;
    case "level":
      return <LevelStep />;
    case "preferences":
      return <PreferencesStep options={options.data} />;
  }
}
