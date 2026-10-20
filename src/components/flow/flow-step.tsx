"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type FlowStepProps = {
  /** Re-keys the section so each step plays its entrance. */
  stepKey: string;
  title: string;
  lead?: string;
  children: ReactNode;
  /** +1 after "next", -1 after "back": which side the step slides in from. */
  direction: 1 | -1;
  /** Shows "back" when given. */
  onBack?: () => void;
  onNext: () => void;
  canContinue: boolean;
  nextLabel?: string;
  pending?: boolean;
  error?: string | null;
};

/**
 * One step of a multi-step flow: heading, answers and the back/next row. Each step slides in from the
 * side it is coming from (RTL: forward comes from the left); `MotionConfig` turns this off for reduced
 * motion.
 */
export function FlowStep({ stepKey, title, lead, children, direction, onBack, onNext, canContinue, nextLabel, pending, error }: FlowStepProps) {
  const titleId = `flow-${stepKey}-title`;

  return (
    <motion.section
      key={stepKey}
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

      <div className={cn("flex items-center gap-3 border-t border-line pt-6", onBack ? "justify-between" : "justify-end")}>
        {onBack ? (
          <Button variant="ghost" className="min-h-11 gap-2" onClick={onBack} disabled={pending}>
            <ArrowRight aria-hidden="true" className="size-5 fill-none" />
            السابق
          </Button>
        ) : null}
        <Button
          variant="primary"
          className={cn("min-h-11 gap-2", pending && "is-loading")}
          onClick={onNext}
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
