"use client";

import { useState } from "react";

import { formatNumber } from "@/lib/format";

import type { TrainerOptionVM } from "../model/types";

type TrainerFilterProps = {
  trainers: TrainerOptionVM[];
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
 * Trainer checkboxes with a type-to-narrow box. Rows that don't match are hidden, not removed:
 * a ticked trainer must stay in the form to be submitted. Without JavaScript the whole list shows.
 */
export function TrainerFilter({ trainers, selected }: TrainerFilterProps) {
  const [query, setQuery] = useState("");
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
        // Enter here would submit the whole filter form before a trainer is picked.
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder="اسم المدرّب"
        autoComplete="off"
        className="ma-input min-h-11 py-2 text-sm"
      />
      <ul className="m-0 flex max-h-64 list-none flex-col overflow-y-auto border border-line p-0">
        {trainers.map((trainer) => (
          <li key={trainer.id} hidden={!matches(trainer)} className="border-b border-line last:border-b-0">
            <label className="ma-check flex min-h-11 w-full px-3 py-1 text-sm">
              <input type="checkbox" name="trainer" value={trainer.id} defaultChecked={selected.includes(trainer.id)} />
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
