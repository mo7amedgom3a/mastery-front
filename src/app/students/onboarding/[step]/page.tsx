import { notFound } from "next/navigation";

import { isOnboardingStep } from "@/features/onboarding/model/steps";
import { OnboardingStepPage } from "@/features/onboarding/onboarding-step-page";

export default async function Page({ params }: PageProps<"/students/onboarding/[step]">) {
  const { step } = await params;
  if (!isOnboardingStep(step)) notFound();
  return <OnboardingStepPage step={step} />;
}
