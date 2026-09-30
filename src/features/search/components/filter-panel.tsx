import { X } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

import { DURATION_FILTER_ENABLED, type SearchState } from "../model/params";
import type { FacetGroupVM, TrainerOptionVM } from "../model/types";
import { FacetChip } from "./facet-chip";
import { RangeFilter } from "./range-filter";
import { SearchForm } from "./search-nav";
import { StateInputs } from "./state-inputs";
import { TrainerFilter } from "./trainer-filter";

export const FILTER_PANEL_ID = "search-filters";

/** Params the form owns; everything else rides along as hidden fields. */
const OWN_PARAMS = ["trainer", "price_min", "price_max", "hours_min", "hours_max"];

type FilterPanelProps = {
  state: SearchState;
  facets: FacetGroupVM[];
  showCounts: boolean;
  trainers: TrainerOptionVM[];
};

/**
 * Every filter in one drawer: the four facets as chips, then trainer, price and duration. A native
 * popover (opens without JavaScript, closes on Escape or a click outside): a side sheet from 600px
 * up, full screen on phones (see `.filter-drawer`). Each change applies at once and the drawer stays
 * open, so filters can be combined while the results update behind it.
 */
export function FilterPanel({ state, facets, showCounts, trainers }: FilterPanelProps) {
  return (
    <aside id={FILTER_PANEL_ID} popover="auto" aria-labelledby="filters-title" className="filter-drawer">
      <div className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
        <h2 id="filters-title" className="m-0 text-xl font-bold">
          كل الفلاتر
        </h2>
        <button
          type="button"
          popoverTarget={FILTER_PANEL_ID}
          popoverTargetAction="hide"
          aria-label="إغلاق الفلاتر"
          className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11"
        >
          <X aria-hidden="true" className="size-5 fill-none" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        {facets.map((facet) => {
          const labelId = `filters-${facet.key}`;
          return (
            <div key={facet.key} role="group" aria-labelledby={labelId}>
              <h3 id={labelId} className="ma-label m-0 mb-3">
                {facet.label}
              </h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {[...facet.options, ...facet.more].map((option) => (
                  <li key={option.code}>
                    <FacetChip option={option} showCount={showCounts} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <SearchForm className="flex flex-col gap-8">
          <StateInputs state={state} omit={OWN_PARAMS} />

          {trainers.length > 0 ? (
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="ma-label mb-3 p-0">المدرّب</legend>
              <TrainerFilter trainers={trainers} selected={state.trainers} />
            </fieldset>
          ) : null}

          <RangeFilter
            legend="السعر"
            unit="دولار"
            minName="price_min"
            maxName="price_max"
            min={state.priceMin}
            max={state.priceMax}
            step={1}
          />

          {DURATION_FILTER_ENABLED ? (
            <RangeFilter
              legend="المدة"
              unit="ساعة"
              minName="hours_min"
              maxName="hours_max"
              min={state.hoursMin}
              max={state.hoursMax}
              step={0.5}
            />
          ) : null}

          {/* Without JavaScript nothing applies itself: this is the way to submit the trainer ticks. */}
          <noscript>
            <button type="submit" className={buttonClass({ variant: "secondary", block: true })}>
              تطبيق الفلاتر
            </button>
          </noscript>
        </SearchForm>
      </div>

      {/* The drawer stays open while filters apply behind it; this goes back to the results. */}
      <div className="sticky bottom-0 border-t border-line bg-surface px-4 py-4 sm:px-6">
        <button
          type="button"
          popoverTarget={FILTER_PANEL_ID}
          popoverTargetAction="hide"
          className={buttonClass({ variant: "secondary", block: true })}
        >
          عرض النتائج
        </button>
      </div>
    </aside>
  );
}
