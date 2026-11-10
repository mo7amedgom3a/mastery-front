"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { plannerQueries, type PlannerEvent, type PlannerItemKind, type PlannerPlan } from "@/lib/api/planner";
import { cn } from "@/lib/cn";

import { DayAgenda } from "./components/day-agenda";
import { ItemEditor, type ItemEditorTarget } from "./components/item-editor";
import { MonthCalendar } from "./components/month-calendar";
import { PlanEditor, type PlanEditorTarget } from "./components/plan-editor";
import { PlanStrip } from "./components/plan-strip";
import { ReminderSettings } from "./components/reminder-settings";
import {
  dateFromKey,
  dayKey,
  FILTERS,
  groupByDay,
  isRange,
  monthStart,
  monthWindow,
  SOURCE_META,
  visibleSources,
  type FilterKey,
} from "./model/calendar";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The student's learning calendar: their own notes, todos, study blocks and plans, laid over the
 * live-diploma sessions and consultations they already have. `?date=YYYY-MM-DD` (reminder emails)
 * opens on that day.
 */
export function PlannerPage() {
  const params = useSearchParams();
  const requested = params.get("date");
  const initialDay = requested && DAY_KEY.test(requested) ? requested : dayKey(new Date());

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [month, setMonth] = useState(() => monthStart(dateFromKey(initialDay)));
  const [filters, setFilters] = useState<Set<FilterKey>>(() => new Set(FILTERS.map((f) => f.key)));
  const [highlight, setHighlight] = useState<PlannerPlan | null>(null);
  const [itemTarget, setItemTarget] = useState<ItemEditorTarget | null>(null);
  const [planTarget, setPlanTarget] = useState<PlanEditorTarget | null>(null);

  const visibleRange = monthWindow(month);
  const calendar = useQuery({
    ...plannerQueries.calendar(visibleRange),
    placeholderData: keepPreviousData,
  });
  const plans = useQuery(plannerQueries.plans());

  const { dotsByDay, agendaByDay, rangeDays } = useMemo(() => {
    const shown = visibleSources(filters);
    const events = (calendar.data?.events ?? []).filter((e) => shown.has(e.source));
    const ranges = events.filter(isRange);
    const covered = new Set<string>();
    for (const [key] of groupByDay(ranges)) covered.add(key);
    return {
      dotsByDay: groupByDay(events.filter((e) => !isRange(e))),
      agendaByDay: groupByDay(events),
      rangeDays: [...covered].map(dateFromKey),
    };
  }, [calendar.data, filters]);

  const visiblePlans = (plans.data ?? []).filter((plan) => {
    const first = dayKey(monthStart(month));
    const last = dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    return plan.ends_on >= first && plan.starts_on <= last;
  });
  const dayEvents: PlannerEvent[] = agendaByDay.get(selectedDay) ?? [];

  const toggleFilter = (key: FilterKey) =>
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selectPlan = (plan: PlannerPlan | null) => {
    setHighlight(plan);
    if (plan) {
      setSelectedDay(plan.starts_on);
      setMonth(monthStart(dateFromKey(plan.starts_on)));
    }
  };
  const editPlanById = (planId: string) => {
    const plan = plans.data?.find((p) => p.plan_id === planId);
    if (plan) setPlanTarget({ mode: "edit", plan });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div role="group" aria-label="إظهار في التقويم" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const on = filters.has(filter.key);
          const meta = SOURCE_META[filter.sources[0]];
          return (
            <button
              key={filter.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggleFilter(filter.key)}
              className={cn(
                "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-[inherit]",
                on ? "border-fg bg-surface text-fg" : "border-line bg-transparent text-fg-muted",
              )}
            >
              <span aria-hidden="true" className={cn("size-2.5 rounded-full", meta.swatch, !on && "opacity-40")} />
              {filter.label}
            </button>
          );
        })}
      </div>

      {calendar.isError ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <div>
            <p className="ma-alert__title">تعذّر تحميل التقويم</p>
            <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-panel border border-line bg-surface p-3">
            {calendar.isPending ? (
              <div role="status">
                <span className="sr-only">جارٍ تحميل التقويم…</span>
                <Skeleton className="h-80" />
              </div>
            ) : (
              <MonthCalendar
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                month={month}
                onMonthChange={(next) => setMonth(monthStart(next))}
                byDay={dotsByDay}
                rangeDays={rangeDays}
                highlight={highlight ? { from: highlight.starts_on, to: highlight.ends_on } : null}
              />
            )}
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg-muted">
              {(["todo", "study", "note", "live_session", "consultation"] as const).map((source) => (
                <li key={source} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("size-2 rounded-full", SOURCE_META[source].swatch)} />
                  {SOURCE_META[source].label}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-3 rounded-sm bg-fg/8 ring-1 ring-line" />
                ضمن خطة أو دبلومة
              </li>
            </ul>
          </div>
          <PlanStrip
            plans={visiblePlans}
            selectedId={highlight?.plan_id ?? null}
            onSelect={selectPlan}
            onEdit={(plan) => setPlanTarget({ mode: "edit", plan })}
            onCreate={() => setPlanTarget({ mode: "create", day: selectedDay })}
          />
          <ReminderSettings />
        </div>

        <DayAgenda
          day={selectedDay}
          events={dayEvents}
          loading={calendar.isPending}
          onAdd={(kind: PlannerItemKind) =>
            setItemTarget({
              mode: "create",
              day: selectedDay,
              kind,
              planId: highlight?.plan_id ?? null,
            })
          }
          onEdit={(event) => setItemTarget({ mode: "edit", event })}
          onEditPlan={editPlanById}
        />
      </div>

      {itemTarget ? <ItemEditor target={itemTarget} plans={plans.data ?? []} onClose={() => setItemTarget(null)} /> : null}
      {planTarget ? (
        <PlanEditor
          target={planTarget}
          onClose={() => {
            setPlanTarget(null);
            setHighlight(null);
          }}
        />
      ) : null}
    </div>
  );
}
