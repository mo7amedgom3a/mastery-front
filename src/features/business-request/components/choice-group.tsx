"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, type ReactNode } from "react";

import { ChoiceChip } from "@/features/onboarding/components/choice-chip";
import { cn } from "@/lib/cn";

type Choice<T> = { value: T; label: string };

type ChoiceGroupProps<T> = {
  legend: string;
  hint?: string;
  choices: readonly Choice<T>[];
  isSelected: (value: T) => boolean;
  onToggle: (value: T) => void;
  error?: string;
  /** Wider, left-aligned chips for long answers (e.g. the budget sentences). */
  stacked?: boolean;
};

/**
 * A question answered with chips. The chips are toggle buttons (`aria-pressed`); the group carries the
 * legend and, when invalid, the error the screen reader hears on focus.
 */
export function ChoiceGroup<T extends string | boolean>({ legend, hint, choices, isSelected, onToggle, error, stacked }: ChoiceGroupProps<T>) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    // `data-invalid`: "next" focuses the first chip of the first unanswered question.
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" aria-describedby={describedBy} data-invalid={error ? "" : undefined}>
      <legend className="mb-3 p-0 font-bold">{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-2 m-0 text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
      <div className={cn("flex gap-2", stacked ? "flex-col items-stretch [&>button]:justify-start [&>button]:text-start" : "flex-wrap")}>
        {choices.map((choice) => (
          <ChoiceChip key={String(choice.value)} selected={isSelected(choice.value)} onToggle={() => onToggle(choice.value)}>
            {choice.label}
          </ChoiceChip>
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="ma-help m-0 text-pink">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Animates a follow-up control (e.g. the "other" text box) in and out of the step. */
export function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="pt-1 pb-1">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
