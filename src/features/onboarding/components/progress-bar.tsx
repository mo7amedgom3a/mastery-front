"use client";

import { FlowProgress } from "@/components/flow/flow-progress";

import { ONBOARDING_STEPS } from "../model/steps";

/**
 * Progress across the onboarding steps.
 * `current`: index of the step on screen; `ONBOARDING_STEPS.length` once every step is done.
 */
export function OnboardingProgress({ current }: { current: number }) {
  return <FlowProgress steps={ONBOARDING_STEPS} current={current} label="تقدّم إعداد ملفك" />;
}
