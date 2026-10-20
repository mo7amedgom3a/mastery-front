"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { FlowStep } from "@/components/flow/flow-step";
import { routes } from "@/config/routes";

import { useOnboardingStore } from "../model/onboarding-store";
import { stepAt, stepIndex, type OnboardingStepId } from "../model/steps";

type StepFrameProps = {
  step: OnboardingStepId;
  title: string;
  lead?: string;
  children: ReactNode;
  /** Whether "next" is allowed (required answers given). */
  canContinue: boolean;
  /** Replaces moving to the next step (the last step submits). */
  onNext?: () => void;
  nextLabel?: string;
  pending?: boolean;
  error?: string | null;
};

/** One onboarding step: `FlowStep` wired to the onboarding routes and the slide direction. */
export function StepFrame({ step, title, lead, children, canContinue, onNext, nextLabel, pending, error }: StepFrameProps) {
  const router = useRouter();
  const direction = useOnboardingStore((state) => state.direction);
  const setDirection = useOnboardingStore((state) => state.setDirection);
  const index = stepIndex(step);
  const previous = stepAt(index - 1);
  const following = stepAt(index + 1);

  const goBack = () => {
    if (!previous) return;
    setDirection(-1);
    router.push(routes.studentOnboarding(previous));
  };
  const goNext = () => {
    setDirection(1);
    if (onNext) onNext();
    else if (following) router.push(routes.studentOnboarding(following));
  };

  return (
    <FlowStep
      stepKey={step}
      title={title}
      lead={lead}
      direction={direction}
      onBack={previous ? goBack : undefined}
      onNext={goNext}
      canContinue={canContinue}
      nextLabel={nextLabel}
      pending={pending}
      error={error}
    >
      {children}
    </FlowStep>
  );
}
