"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

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

/**
 * One onboarding step: heading, answers and the back/next row. Each step slides in from the side it
 * is coming from (RTL: forward comes from the left); `MotionConfig` turns this off for reduced motion.
 */
export function StepFrame({ step, title, lead, children, canContinue, onNext, nextLabel, pending, error }: StepFrameProps) {
  const router = useRouter();
  const direction = useOnboardingStore((state) => state.direction);
  const setDirection = useOnboardingStore((state) => state.setDirection);
  const index = stepIndex(step);
  const previous = stepAt(index - 1);
  const following = stepAt(index + 1);
  const titleId = `onboarding-${step}-title`;

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
    <motion.section
      key={step}
      aria-labelledby={titleId}
      initial={{ opacity: 0, x: direction * -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
    >
      <header className="flex flex-col gap-3">
        <h1 id={titleId} className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">
          {title}
        </h1>
        {lead ? <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">{lead}</p> : null}
      </header>

      {children}

      {error ? (
        <p role="alert" className="m-0 border-s-4 border-pink ps-3 leading-6 font-medium">
          {error}
        </p>
      ) : null}

      <div className={cn("flex items-center gap-3 border-t border-line pt-6", previous ? "justify-between" : "justify-end")}>
        {previous ? (
          <Button variant="ghost" className="min-h-11 gap-2" onClick={goBack} disabled={pending}>
            <ArrowRight aria-hidden="true" className="size-5 fill-none" />
            السابق
          </Button>
        ) : null}
        <Button
          variant="primary"
          className={cn("min-h-11 gap-2", pending && "is-loading")}
          onClick={goNext}
          disabled={!canContinue || pending}
          aria-busy={pending}
        >
          {nextLabel ?? "التالي"}
          <ArrowLeft aria-hidden="true" className="size-5 fill-none" />
        </Button>
      </div>
    </motion.section>
  );
}
