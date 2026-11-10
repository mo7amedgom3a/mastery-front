"use client";

import { INSIGHTS_RANGES, type InsightsRange } from "@/lib/api/insights";
import { cn } from "@/lib/cn";

import { RANGE_LABELS } from "../model/format";

/** Segmented 30 / 90 / 365-day switch. */
export function RangeFilter({ value, onChange }: { value: InsightsRange; onChange: (range: InsightsRange) => void }) {
  return (
    <div role="group" aria-label="الفترة" className="inline-flex rounded-ctl border border-line bg-surface p-1">
      {INSIGHTS_RANGES.map((range) => {
        const active = range === value;
        return (
          <button
            key={range}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(range)}
            className={cn(
              "min-h-11 rounded-chip px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-4",
              active ? "bg-fg text-surface" : "text-fg-muted hover:text-fg",
            )}
          >
            {RANGE_LABELS[range]}
          </button>
        );
      })}
    </div>
  );
}
