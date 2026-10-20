"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/cn";

type FlowProgressProps = {
  steps: readonly { id: string; label: string }[];
  /** Index of the step on screen; `steps.length` once every step is done. */
  current: number;
  /** Accessible name of the progress bar. */
  label: string;
};

/**
 * Horizontal progress across the steps of a flow. It lives in the flow's layout, so it stays mounted
 * between step pages and the fill springs from one step to the next.
 */
export function FlowProgress({ steps, current, label: name }: FlowProgressProps) {
  const total = steps.length;
  const done = Math.min(Math.max(current, 0), total);
  // Halfway into the current step, so the first step already shows some progress.
  const percent = done >= total ? 100 : ((done + 0.5) / total) * 100;
  const label = done >= total ? "اكتمل" : `الخطوة ${done + 1} من ${total}: ${steps[done]?.label}`;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="progressbar"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={label}
        className="h-2.5 overflow-hidden rounded-full bg-line"
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
        />
      </div>

      <ol
        className="m-0 grid list-none gap-2 p-0 text-xs sm:text-sm"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const complete = index < done;
          const active = index === done;
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className={cn("flex min-w-0 items-center gap-1.5", active ? "font-bold text-fg" : "text-fg-muted")}
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: active ? 1.15 : 1 }}
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[11px] tabular-nums",
                  complete && "border-accent bg-accent text-ink",
                  active && "border-fg",
                  !complete && !active && "border-line-strong",
                )}
              >
                {complete ? <Check className="size-3 fill-none" strokeWidth={3} /> : index + 1}
              </motion.span>
              <span className="truncate max-sm:hidden">{step.label}</span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 text-sm text-fg-muted sm:hidden" aria-hidden="true">
        {label}
      </p>
    </div>
  );
}
