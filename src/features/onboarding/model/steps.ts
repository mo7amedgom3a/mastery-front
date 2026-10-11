export const ONBOARDING_STEPS = [
  { id: "goal", label: "هدفك" },
  { id: "skills", label: "ما تريد تعلّمه" },
  { id: "strengths", label: "ما تتقنه" },
  { id: "level", label: "مستواك ووقتك" },
  { id: "preferences", label: "اهتماماتك" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

export function isOnboardingStep(value: string): value is OnboardingStepId {
  return ONBOARDING_STEPS.some((step) => step.id === value);
}

/** 0-based position of a step; -1 for anything else (e.g. the results page). */
export function stepIndex(step: string | null | undefined): number {
  return ONBOARDING_STEPS.findIndex((item) => item.id === step);
}

export function stepAt(index: number): OnboardingStepId | null {
  return ONBOARDING_STEPS[index]?.id ?? null;
}
