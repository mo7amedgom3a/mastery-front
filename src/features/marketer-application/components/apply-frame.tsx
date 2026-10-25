"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { FlowStep } from "@/components/flow/flow-step";
import { routes } from "@/config/routes";

import { answersOf, useApplyStore } from "../model/apply-store";
import { stepErrors } from "../model/schema";
import { stepAt, stepIndex, type ApplyStepId } from "../model/steps";

type ApplyFrameProps = {
  step: ApplyStepId;
  title: string;
  lead?: string;
  children: ReactNode;
  /** Replaces moving to the next step (the last step submits). */
  onNext?: () => void;
  nextLabel?: string;
  /** Consent shown directly above the back/next row. */
  beforeNext?: ReactNode;
  pending?: boolean;
  error?: string | null;
  disabled?: boolean;
};

/**
 * One step of the marketer application: `FlowStep` wired to the apply routes. "Next" checks the step's
 * answers first and shows what's missing instead of moving on.
 */
export function ApplyFrame({ step, title, lead, children, onNext, nextLabel, beforeNext, pending, error, disabled }: ApplyFrameProps) {
  const router = useRouter();
  const direction = useApplyStore((state) => state.direction);
  const setDirection = useApplyStore((state) => state.setDirection);
  const setErrors = useApplyStore((state) => state.setErrors);
  const index = stepIndex(step);
  const previous = stepAt(index - 1);
  const following = stepAt(index + 1);

  const goBack = () => {
    if (!previous) return;
    setDirection(-1);
    setErrors({});
    router.push(routes.marketersApply(previous));
  };
  const goNext = () => {
    const errors = stepErrors(step, answersOf(useApplyStore.getState()));
    setErrors(errors);
    if (Object.keys(errors).length > 0) {
      // After the errors render: move focus to the first invalid control.
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setDirection(1);
    if (onNext) onNext();
    else if (following) router.push(routes.marketersApply(following));
  };

  return (
    <FlowStep
      stepKey={step}
      title={title}
      lead={lead}
      direction={direction}
      onBack={previous ? goBack : undefined}
      onNext={goNext}
      canContinue={!disabled}
      beforeNext={beforeNext}
      nextLabel={nextLabel}
      pending={pending}
      error={error}
    >
      {children}
    </FlowStep>
  );
}
