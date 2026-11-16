"use client";

import { clsx } from "clsx";

import { buttonClass } from "@/components/ui/button";

export type FilterChip = {
  key: string;
  label: string;
};

type FilterChipsProps = {
  /** Accessible name for the group, e.g. "تصفية الدورات حسب المجال". */
  label: string;
  /** Filters derived from the cards that actually have matches. */
  filters: readonly FilterChip[];
  /** Selected filter key, or null for "الكل". */
  activeKey: string | null;
  onSelect: (key: string | null) => void;
  allLabel?: string;
  className?: string;
};

/**
 * The one filter-chip row used by the landing catalog rails and the podcast section. Chips are the
 * kit's small soft/secondary buttons; the hit area grows to 44px through a pseudo-element so the
 * visual stays compact on the scrollable phone row.
 */
export function FilterChips({
  label,
  filters,
  activeKey,
  onSelect,
  allLabel = "الكل",
  className,
}: FilterChipsProps) {
  // One filter is not a choice; the row only earns its space from two options up.
  if (filters.length < 2) {
    return null;
  }

  const chips: { key: string | null; label: string }[] = [{ key: null, label: allLabel }, ...filters];

  return (
    <div role="group" aria-label={label} className={clsx("mt-10 short:mt-6", className)}>
      <ul className="-mx-4 m-0 flex list-none gap-2 overflow-x-auto p-0 px-4 pt-1 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((chip) => {
          const selected = activeKey === chip.key;
          return (
            <li key={chip.key ?? "all"} className="shrink-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(chip.key)}
                className={clsx(
                  buttonClass({ variant: selected ? "secondary" : "soft", size: "sm" }),
                  "relative before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
                )}
              >
                {chip.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
