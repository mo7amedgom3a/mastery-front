"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { FlowStep } from "@/components/flow/flow-step";
import { routes } from "@/config/routes";

import { useRequestStore } from "../model/request-store";
import { stepErrors } from "../model/schema";
import { stepAt, stepIndex, type RequestStepId } from "../model/steps";

type RequestFrameProps = {
  step: RequestStepId;
  title: string;
  lead?: string;
  children: ReactNode;
  /** Replaces moving to the next step (the last step submits). */
  onNext?: () => void;
  nextLabel?: string;
  pending?: boolean;
  error?: string | null;
  /** Blocks "next" (e.g. while the step's choices failed to load). */
  disabled?: boolean;
};

/**
 * One step of the company request: `FlowStep` wired to the request routes. "Next" checks the step's
 * answers first and shows what's missing instead of moving on.
 */
export function RequestFrame({ step, title, lead, children, onNext, nextLabel, pending, error, disabled }: RequestFrameProps) {
  const router = useRouter();
  const direction = useRequestStore((state) => state.direction);
  const setDirection = useRequestStore((state) => state.setDirection);
  const setErrors = useRequestStore((state) => state.setErrors);
  const index = stepIndex(step);
  const previous = stepAt(index - 1);
  const following = stepAt(index + 1);

  const goBack = () => {
    if (!previous) return;
    setDirection(-1);
    setErrors({});
    router.push(routes.businessRequest(previous));
  };
  const goNext = () => {
    const errors = stepErrors(step, useRequestStore.getState());
    setErrors(errors);
    if (Object.keys(errors).length > 0) {
      // After the errors render: move focus to the first invalid control or unanswered question.
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid] button")?.focus());
      return;
    }
    setDirection(1);
    if (onNext) onNext();
    else if (following) router.push(routes.businessRequest(following));
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
      nextLabel={nextLabel}
      pending={pending}
      error={error}
    >
      {children}
    </FlowStep>
  );
}
