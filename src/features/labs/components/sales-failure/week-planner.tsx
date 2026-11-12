"use client";

import { CalendarDays, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { ActivityId, SalesFailureScenario, WeekDay, WeekPlan } from "../../content/sales-failure/types";
import { planStats } from "../../content/sales-failure/score";
import { LabPanel, Pill } from "../bits";

const emptyPlan: Record<WeekDay, ActivityId[]> = { sun: [], mon: [], tue: [], wed: [], thu: [] };

/** Five days, two activities each: the weekly plan that prevents «الافتقار لخطة». */
export function WeekPlanner({ scenario, onDone }: { scenario: SalesFailureScenario; onDone: (plan: WeekPlan) => void }) {
  const [plan, setPlan] = useState<Record<WeekDay, ActivityId[]>>(emptyPlan);
  const stats = planStats(plan, scenario.activities);
  const ready = scenario.week.every((day) => plan[day.id].length === 2);

  const toggle = (day: WeekDay, activity: ActivityId) => {
    setPlan((current) => {
      const picked = current[day];
      if (picked.includes(activity)) return { ...current, [day]: picked.filter((id) => id !== activity) };
      if (picked.length >= 2) return current;
      return { ...current, [day]: [...picked, activity] };
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-5 text-accent" aria-hidden /> خطة الأسبوع
          </span>
        }
        subtitle="لكل يوم نشاطان فقط. الأسبوع المتوازن يغطي التنقيب والمكالمات والزيارات والمتابعة والعروض."
        action={<Pill>{ready ? "جاهز" : "اختر نشاطين لكل يوم"}</Pill>}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {scenario.week.map((day) => (
            <div key={day.id} className="flex min-w-0 flex-col gap-2 rounded-photo border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{day.label}</span>
                <span className={cn("text-[12px] tabular-nums", plan[day.id].length === 2 ? "text-green" : "text-fg-muted")}>
                  {plan[day.id].length}/2
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {scenario.activities.map((activity) => {
                  const selected = plan[day.id].includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(day.id, activity.id)}
                      className={cn(
                        "flex items-center justify-between gap-1 rounded-[4px] border px-2 py-1 text-[12px] leading-5 transition-colors",
                        selected ? "border-accent bg-accent/10 font-semibold" : "border-line hover:border-line-strong",
                      )}
                    >
                      <span>{activity.label}</span>
                      {selected ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={!ready} onClick={() => ready && onDone(plan)}>
            التالي: احسب القمع
          </Button>
        </div>
      </LabPanel>

      <aside className="flex flex-col gap-4">
        <LabPanel title="تغطية الأسبوع" subtitle="الأنشطة الأساسية الخمسة">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {scenario.activities
              .filter((activity) => activity.core)
              .map((activity) => {
                const covered = Object.values(plan).some((day) => day.includes(activity.id));
                return (
                  <li key={activity.id} className="flex items-center justify-between gap-2 rounded-photo border border-line px-3 py-2 text-[13px]">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full border",
                          covered ? "border-green bg-green text-ink" : "border-line",
                        )}
                      >
                        {covered ? <Check className="size-3" strokeWidth={3} /> : null}
                      </span>
                      {activity.label}
                    </span>
                    <span className="text-[12px] text-fg-muted">{activity.hint}</span>
                  </li>
                );
              })}
          </ul>
          <p className="m-0 text-[13px] leading-6 text-fg-muted">
            {stats.balanced
              ? "خطة متوازنة: كل نشاط أساسي حاضر دون أن يبتلع نشاطٌ الأسبوع كله."
              : "غطّيت " + stats.covered + " من " + stats.total + ". راجع الأيام الفارغة قبل المتابعة."}
          </p>
        </LabPanel>
        <LabPanel title="الهدف" subtitle="هذا الشهر">
          <p className="m-0 text-3xl font-bold tabular-nums">{scenario.funnel.deals} صفقات</p>
          <p className="m-0 text-[13px] leading-6 text-fg-muted">
            الأسبوع ليس قائمة مهام؛ هو توزيع للجهد على الأنشطة التي تصنع الصفقات.
          </p>
        </LabPanel>
      </aside>
    </div>
  );
}
