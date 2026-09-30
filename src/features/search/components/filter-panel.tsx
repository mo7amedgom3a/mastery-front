import { X } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

import { DURATION_FILTER_ENABLED, searchHref, type SearchState } from "../model/params";
import type { TrainerOptionVM } from "../model/types";
import { SearchForm } from "./search-nav";
import { StateInputs } from "./state-inputs";
import { TrainerFilter } from "./trainer-filter";

export const FILTER_PANEL_ID = "search-filters";

/** Params this form owns; everything else rides along as hidden fields. */
const OWN_PARAMS = ["trainer", "price_min", "price_max", "hours_min", "hours_max"];

type FilterPanelProps = {
  state: SearchState;
  trainers: TrainerOptionVM[];
};

function RangeFields({
  legend,
  unit,
  minName,
  maxName,
  min,
  max,
  step,
}: {
  legend: string;
  unit: string;
  minName: string;
  maxName: string;
  min: number | null;
  max: number | null;
  step: number;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="ma-label mb-2 p-0">
        {legend} <span className="font-normal text-fg-muted">({unit})</span>
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="ma-field">
          <label htmlFor={minName} className="text-xs text-fg-muted">
            من
          </label>
          <input
            id={minName}
            name={minName}
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            defaultValue={min ?? ""}
            dir="ltr"
            className="ma-input min-h-11 px-3 py-2 text-sm"
          />
        </div>
        <div className="ma-field">
          <label htmlFor={maxName} className="text-xs text-fg-muted">
            إلى
          </label>
          <input
            id={maxName}
            name={maxName}
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            defaultValue={max ?? ""}
            dir="ltr"
            className="ma-input min-h-11 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </fieldset>
  );
}

/**
 * The slower filters: trainer, price and duration, applied together with one button. A sidebar
 * from 900px up; below that the same element is a native popover drawer (see `.filter-drawer`),
 * opened by the "الفلاتر" button in the results toolbar.
 */
export function FilterPanel({ state, trainers }: FilterPanelProps) {
  return (
    <aside id={FILTER_PANEL_ID} popover="auto" aria-label="فلاتر إضافية" className="filter-drawer">
      <div className="mb-4 flex min-h-11 items-center justify-between md:hidden">
        <h2 className="m-0 text-xl font-bold">الفلاتر</h2>
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

      {/* Re-created per search so the fields always show the filters in force. */}
      <SearchForm key={searchHref(state)} closePopoverId={FILTER_PANEL_ID} className="flex flex-col gap-8">
        <StateInputs state={state} omit={OWN_PARAMS} />

        {trainers.length > 0 ? (
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="ma-label mb-2 p-0">المدرّب</legend>
            <TrainerFilter trainers={trainers} selected={state.trainers} />
          </fieldset>
        ) : null}

        <RangeFields
          legend="السعر"
          unit="دولار"
          minName="price_min"
          maxName="price_max"
          min={state.priceMin}
          max={state.priceMax}
          step={1}
        />

        {DURATION_FILTER_ENABLED ? (
          <RangeFields
            legend="المدة"
            unit="ساعة"
            minName="hours_min"
            maxName="hours_max"
            min={state.hoursMin}
            max={state.hoursMax}
            step={0.5}
          />
        ) : null}

        <button type="submit" className={buttonClass({ variant: "secondary", block: true })}>
          تطبيق الفلاتر
        </button>
      </SearchForm>
    </aside>
  );
}
