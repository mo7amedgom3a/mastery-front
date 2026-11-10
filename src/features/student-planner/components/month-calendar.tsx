"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { DayButtonProps } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import type { PlannerEvent, PlannerEventSource } from "@/lib/api/planner";
import { cn } from "@/lib/cn";

import { dateFromKey, dayKey, SOURCE_META } from "../model/calendar";

type DayInfo = {
  sources: PlannerEventSource[];
  openTodos: number;
  count: number;
};

/** Per-day summaries, read by the custom day button (react-day-picker renders it, not us). */
const DaysContext = createContext<Map<string, DayInfo>>(new Map());

const DOT_ORDER: readonly PlannerEventSource[] = ["live_session", "consultation", "study", "todo", "note"];

function summarize(byDay: Map<string, PlannerEvent[]>): Map<string, DayInfo> {
  const out = new Map<string, DayInfo>();
  for (const [key, events] of byDay) {
    const present = new Set(events.map((e) => e.source));
    out.set(key, {
      sources: DOT_ORDER.filter((s) => present.has(s)),
      openTodos: events.filter((e) => e.source === "todo" && !e.is_done).length,
      count: events.length,
    });
  }
  return out;
}

/** The library's day button (keeps keyboard focus handling) plus source dots under the number. */
function PlannerDayButton({ day, modifiers, children, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const info = useContext(DaysContext).get(dayKey(day.date));
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const label = info?.count ? `، ${info.count} ${info.count === 1 ? "عنصر" : "عناصر"}` : "";
  return (
    <button ref={ref} className={className} {...props} aria-label={`${props["aria-label"] ?? ""}${label}`}>
      <span className="leading-none">{children}</span>
      {info && info.sources.length ? (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 flex justify-center gap-0.5">
          {info.sources.slice(0, 4).map((source) => (
            <span key={source} className={cn("size-1.5 rounded-full ring-1 ring-surface", SOURCE_META[source].swatch)} />
          ))}
        </span>
      ) : null}
      {info?.openTodos ? (
        <span
          aria-hidden="true"
          className="absolute end-1 top-1 min-w-4 rounded-full bg-fg px-1 text-[10px] leading-4 font-bold text-surface"
        >
          {info.openTodos}
        </span>
      ) : null}
    </button>
  );
}

export function MonthCalendar({
  selectedDay,
  onSelectDay,
  month,
  onMonthChange,
  byDay,
  rangeDays,
  highlight,
}: {
  selectedDay: string;
  onSelectDay: (key: string) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  byDay: Map<string, PlannerEvent[]>;
  /** Days covered by a plan or a live cohort: a soft band behind the number. */
  rangeDays: Date[];
  /** The plan the student picked in the strip, outlined strongly. */
  highlight: { from: string; to: string } | null;
}) {
  const summaries = summarize(byDay);
  return (
    <DaysContext.Provider value={summaries}>
      <Calendar
        mode="single"
        required
        showOutsideDays
        selected={dateFromKey(selectedDay)}
        onSelect={(date) => onSelectDay(dayKey(date))}
        month={month}
        onMonthChange={onMonthChange}
        modifiers={{
          inRange: rangeDays,
          highlighted: highlight
            ? {
                from: dateFromKey(highlight.from),
                to: dateFromKey(highlight.to),
              }
            : [],
        }}
        modifiersClassNames={{
          // Skipped on the selected cell so its accent fill always wins.
          inRange: "[&:not([data-selected])>button]:bg-fg/8",
          highlighted: "[&>button]:border-fg [&>button]:border-dashed",
        }}
        components={{ DayButton: PlannerDayButton }}
      />
    </DaysContext.Provider>
  );
}
