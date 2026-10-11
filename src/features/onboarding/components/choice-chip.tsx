"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ChoiceChipProps = {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  disabled?: boolean;
};

/** A toggle chip for multi-select answers (skills, topics, product types). */
export function ChoiceChip({ selected, onToggle, children, disabled }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "ma-btn ma-btn--sm min-h-11 gap-1.5 rounded-full px-4 transition-colors",
        selected ? "ma-btn--secondary" : "ma-btn--soft",
      )}
    >
      {selected ? <Check aria-hidden="true" className="size-4 fill-none" strokeWidth={2.5} /> : null}
      {children}
    </button>
  );
}
