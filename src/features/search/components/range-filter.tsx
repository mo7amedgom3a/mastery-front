"use client";

import { ArrowLeft } from "lucide-react";
import { useState, type FocusEvent } from "react";

type RangeFilterProps = {
  legend: string;
  unit: string;
  minName: string;
  maxName: string;
  /** The range in the URL. */
  min: number | null;
  max: number | null;
  step: number;
};

type Bound = "min" | "max";

const text = (value: number | null) => (value === null ? "" : String(value));

/**
 * A from/to pair that applies itself: leaving a field (or Enter, or the arrow button) submits the
 * form when the value changed. Typing alone doesn't, so a half-typed number never searches.
 */
export function RangeFilter({ legend, unit, minName, maxName, min, max, step }: RangeFilterProps) {
  const [values, setValues] = useState({ min: text(min), max: text(max) });
  const [focused, setFocused] = useState<Bound | null>(null);

  // Follow the URL when it changes some other way (a chip removed, "clear all", back), except in
  // the field being typed in right now.
  const appliedKey = `${text(min)}:${text(max)}`;
  const [syncedKey, setSyncedKey] = useState(appliedKey);
  if (syncedKey !== appliedKey) {
    setSyncedKey(appliedKey);
    setValues((current) => ({
      min: focused === "min" ? current.min : text(min),
      max: focused === "max" ? current.max : text(max),
    }));
  }

  const applied = { min: text(min), max: text(max) };
  const onBlur = (bound: Bound) => (event: FocusEvent<HTMLInputElement>) => {
    setFocused(null);
    if (event.currentTarget.value.trim() !== applied[bound]) event.currentTarget.form?.requestSubmit();
  };

  const field = (bound: Bound, name: string, label: string) => (
    <div className="ma-field min-w-0">
      <label htmlFor={name} className="text-xs text-fg-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={values[bound]}
        onChange={(event) => setValues((current) => ({ ...current, [bound]: event.target.value }))}
        onFocus={() => setFocused(bound)}
        onBlur={onBlur(bound)}
        dir="ltr"
        className="ma-input min-h-11 px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="ma-label mb-2 p-0">
        {legend} <span className="font-normal text-fg-muted">({unit})</span>
      </legend>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
        {field("min", minName, "من")}
        {field("max", maxName, "إلى")}
        {/* Also what Enter in either field triggers, and the way to apply without JavaScript. */}
        <button
          type="submit"
          aria-label={`تطبيق ${legend}`}
          className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11"
        >
          <ArrowLeft aria-hidden="true" className="size-4 fill-none" />
        </button>
      </div>
    </fieldset>
  );
}
