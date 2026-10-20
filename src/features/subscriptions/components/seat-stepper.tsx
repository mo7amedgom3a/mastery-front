"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

type SeatStepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (seats: number) => void;
  label?: string;
  error?: string;
};

/**
 * Team size: − / + buttons around a number field, kept within the plan's range. Typing a number above the
 * range shows the way to the business team instead of silently capping it.
 */
export function SeatStepper({ value, min, max, onChange, label = "عدد الموظفين", error }: SeatStepperProps) {
  const id = useId();
  // What is typed, so an in-between value ("1" on the way to "12") isn't snapped while typing.
  const [draft, setDraft] = useState<string | null>(null);
  const typed = draft === null ? value : Number(draft);
  const tooLarge = Number.isFinite(typed) && typed > max;
  const set = (next: number) => {
    setDraft(null);
    onChange(Math.min(max, Math.max(min, next)));
  };
  const hint = error ?? (tooLarge ? null : `من ${min} إلى ${max} موظفاً`);

  return (
    <div className="ma-field">
      <label htmlFor={id} className="ma-label">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className="ma-btn ma-btn--soft ma-btn--icon size-11" aria-label="موظف أقل" disabled={value <= min} onClick={() => set(value - 1)}>
          <Minus aria-hidden="true" className="size-4 fill-none" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          dir="ltr"
          min={min}
          max={max}
          value={draft ?? String(value)}
          aria-invalid={Boolean(error) || tooLarge || undefined}
          aria-describedby={`${id}-help`}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const size = Number(next);
            if (Number.isInteger(size) && size >= min && size <= max) onChange(size);
          }}
          onBlur={() => {
            if (draft !== null && Number(draft) <= max) set(Number(draft) || min);
          }}
          className="ma-input w-24 text-center text-lg font-bold tabular-nums"
        />
        <button type="button" className="ma-btn ma-btn--soft ma-btn--icon size-11" aria-label="موظف أكثر" disabled={value >= max} onClick={() => set(value + 1)}>
          <Plus aria-hidden="true" className="size-4 fill-none" />
        </button>
      </div>
      <p id={`${id}-help`} className="ma-help m-0" role={tooLarge ? "status" : undefined}>
        {tooLarge ? (
          <>
            لفرق أكبر من {max} موظفاً نصمم عرضاً خاصاً.{" "}
            <AppLink href={`${routes.businessRequest("company")}?teamSize=${Math.round(typed)}` as typeof routes.business} className="font-bold">
              تواصل معنا
            </AppLink>
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}
