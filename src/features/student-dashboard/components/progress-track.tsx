import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ProgressTrackProps = {
  value: number;
  max?: number;
  label?: ReactNode;
  /** e.g. "68%" or "2 من 4"; defaults to the percentage when `label` is present. */
  valueLabel?: ReactNode;
  /** Accessible name for the bar; pass one when `label` is not a plain string. */
  ariaLabel?: string;
  className?: string;
  trackClassName?: string;
};

/** A thin progress bar with the kit's row label/value, usable on light panels and the coral hero. */
export function ProgressTrack({
  value,
  max = 100,
  label,
  valueLabel,
  ariaLabel,
  className,
  trackClassName,
}: ProgressTrackProps) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const shown = valueLabel ?? (label ? `${Math.round(percent)}%` : null);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label || shown ? (
        <div className="flex items-baseline justify-between gap-2 text-[13px] leading-5 text-fg-muted">
          <span className="min-w-0">{label}</span>
          {shown ? <span className="shrink-0 font-semibold text-fg tabular-nums">{shown}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        aria-valuenow={Math.min(Math.max(value, 0), safeMax)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className={cn("h-1.5 overflow-hidden rounded-full bg-line", trackClassName)}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
