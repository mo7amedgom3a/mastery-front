"use client";

import { clsx } from "clsx";
import { Pause, Play } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

type PauseButtonProps = {
  paused: boolean;
  onToggle: () => void;
  className?: string;
};

/**
 * Explicit pause/resume for the auto-advancing landing carousels (WCAG 2.2.2). Carries
 * `data-carousel-control` so the sections' focus-pause handlers ignore it: a focused play button
 * must not immediately pause the rotation it just resumed.
 */
export function PauseButton({ paused, onToggle, className }: PauseButtonProps) {
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "تشغيل التبديل التلقائي" : "إيقاف التبديل التلقائي"}
      aria-pressed={paused}
      data-carousel-control
      className={clsx(buttonClass({ variant: "bare" }), "ma-btn--icon size-11 min-h-11 shrink-0", className)}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
