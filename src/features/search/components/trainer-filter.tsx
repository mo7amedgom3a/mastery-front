"use client";

import { useState } from "react";

import { formatNumber } from "@/lib/format";

import type { TrainerOptionVM } from "../model/types";

type TrainerFilterProps = {
  trainers: TrainerOptionVM[];
  /** Trainers in the URL. */
  selected: readonly number[];
};

/** Arabic spelling variants fold together, so "احمد" finds "أحمد". */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

/**
 * Trainer checkboxes with a type-to-narrow box. Ticking one applies it at once (the form submits
 * itself). Rows that don't match the box are hidden, not removed: a ticked trainer must stay in
 * the form to be submitted. Without JavaScript the whole list shows and the form's button applies.
 */
export function TrainerFilter({ trainers, selected }: TrainerFilterProps) {
  const [query, setQuery] = useState("");
  // Ticks show at once; the URL catches up. When the URL changes some other way (a chip removed,
  // "clear all", back), the ticks follow it.
  const [picked, setPicked] = useState<readonly number[]>(selected);
  const selectedKey = selected.join(",");
  const [syncedKey, setSyncedKey] = useState(selectedKey);
  if (syncedKey !== selectedKey) {
    setSyncedKey(selectedKey);
    setPicked(selected);
  }

  const needle = fold(query.trim());
  const matches = (trainer: TrainerOptionVM) => !needle || fold(trainer.name).includes(needle);
  const shown = trainers.filter(matches).length;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="trainer-search" className="sr-only">
        ابحث عن مدرّب
      </label>
      <input
        id="trainer-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        // Enter here would submit the form; this box only narrows the list.
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder="اسم المدرّب"
        autoComplete="off"
        className="ma-input min-h-11 py-2 text-sm"
      />
      <ul className="m-0 flex max-h-64 list-none flex-col overflow-y-auto rounded-panel border border-line p-0">
        {trainers.map((trainer) => (
          <li key={trainer.id} hidden={!matches(trainer)} className="border-b border-line last:border-b-0">
            <label className="ma-check flex min-h-11 w-full px-3 py-1 text-sm">
              <input
                type="checkbox"
                name="trainer"
                value={trainer.id}
                checked={picked.includes(trainer.id)}
                onChange={(event) => {
                  const { checked, form } = event.currentTarget;
                  setPicked((current) =>
                    checked ? [...current, trainer.id] : current.filter((id) => id !== trainer.id),
                  );
                  // The box already holds its new state, so the form submits the new selection.
                  form?.requestSubmit();
                }}
              />
              <span className="min-w-0 flex-1">{trainer.name}</span>
              <span className="text-xs text-fg-muted tabular-nums">{formatNumber(trainer.count)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p role="status" className="m-0 text-xs text-fg-muted">
        {shown === 0 ? "لا يوجد مدرّب بهذا الاسم." : null}
      </p>
    </div>
  );
}
