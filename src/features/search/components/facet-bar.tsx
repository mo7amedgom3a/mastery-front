import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import type { FacetGroupVM } from "../model/types";
import { DismissDetails } from "./dismiss-details";
import { FacetChip } from "./facet-chip";
import { FILTER_PANEL_ID } from "./filter-panel";

/** One dropdown open at a time: `<details>` elements sharing a name close each other. */
const GROUP = "search-facets";

// Tighter on phones, so the four dropdowns share one line.
const trigger = "ma-btn ma-btn--soft ma-btn--sm min-h-11 gap-2 max-sm:gap-1 max-sm:px-2.5";

function Count({ value }: { value: number }) {
  return (
    <span className="grid min-w-5 place-items-center bg-accent px-1 text-xs leading-5 font-bold text-on-accent tabular-nums">
      {formatNumber(value)}
    </span>
  );
}

type FacetBarProps = {
  facets: FacetGroupVM[];
  showCounts: boolean;
  /** Filters in force, shown on the "all filters" button. */
  activeCount: number;
};

/**
 * The quick filters as one line above the results: a dropdown per facet (type, field, skill, tag)
 * and a button for the drawer that holds every filter. Closed, the bar is a single row; an open
 * dropdown lays its options over the results instead of pushing them down. Every option is a link
 * to the search with it toggled, and the dropdown stays open so several can be picked.
 */
export function FacetBar({ facets, showCounts, activeCount }: FacetBarProps) {
  return (
    // `relative`: the open dropdown spans the bar's full width, whichever button opened it.
    <div className="relative flex flex-wrap items-center gap-2">
      <DismissDetails group={GROUP} />
      {facets.map((facet) => {
        const options = [...facet.options, ...facet.more];
        const selected = options.filter((option) => option.selected).length;
        return (
          <details key={facet.key} name={GROUP} className="group">
            <summary
              className={cn(
                trigger,
                "list-none group-open:bg-fg group-open:text-surface [&::-webkit-details-marker]:hidden",
              )}
            >
              {facet.label}
              {selected > 0 ? <Count value={selected} /> : null}
              <ChevronDown aria-hidden="true" className="size-4 fill-none transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-panel border border-line-strong bg-surface p-4">
              <ul aria-label={facet.label} className="m-0 flex list-none flex-wrap gap-2 p-0">
                {options.map((option) => (
                  <li key={option.code}>
                    <FacetChip option={option} showCount={showCounts} />
                  </li>
                ))}
              </ul>
            </div>
          </details>
        );
      })}

      <button type="button" popoverTarget={FILTER_PANEL_ID} className={cn(trigger, "ms-auto")}>
        <SlidersHorizontal aria-hidden="true" className="size-4 fill-none" />
        كل الفلاتر
        {activeCount > 0 ? <Count value={activeCount} /> : null}
      </button>
    </div>
  );
}
