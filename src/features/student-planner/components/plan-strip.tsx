"use client";

import { CalendarRange, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PlannerPlan } from "@/lib/api/planner";
import { cn } from "@/lib/cn";
import { formatCalendarDate } from "@/lib/format";

import { planSwatch } from "../model/calendar";

export function PlanStrip({
  plans,
  selectedId,
  onSelect,
  onEdit,
  onCreate,
}: {
  plans: readonly PlannerPlan[];
  selectedId: string | null;
  onSelect: (plan: PlannerPlan | null) => void;
  onEdit: (plan: PlannerPlan) => void;
  onCreate: () => void;
}) {
  return (
    <section aria-labelledby="planner-plans-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="planner-plans-title" className="m-0 flex items-center gap-2 text-base font-bold">
          <CalendarRange aria-hidden="true" className="size-4 fill-none text-accent" />
          خطط التعلّم
        </h2>
        <Button size="sm" variant="soft" onClick={onCreate}>
          <Plus aria-hidden="true" className="size-4" />
          خطة جديدة
        </Button>
      </div>
      {plans.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">حدّد مدة لتعلّم شيء ما، مثل إنهاء كورس خلال أسبوعين، ثم وزّع عليها المهام.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {plans.map((plan) => {
            const percent = plan.todo_total ? Math.round((plan.todo_done / plan.todo_total) * 100) : 0;
            const active = selectedId === plan.plan_id;
            return (
              <li key={plan.plan_id} className={cn("flex items-stretch gap-2 rounded-panel border", active ? "border-fg" : "border-line")}>
                <button
                  type="button"
                  onClick={() => onSelect(active ? null : plan)}
                  aria-pressed={active}
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-0 bg-transparent p-3 text-start font-[inherit] text-fg"
                >
                  <span aria-hidden="true" className={cn("mt-1 size-3 shrink-0 rounded-full", planSwatch(plan.color))} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className={cn("truncate font-medium", plan.status === "completed" && "line-through text-fg-muted")}>
                      {plan.title}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {formatCalendarDate(plan.starts_on)} – {formatCalendarDate(plan.ends_on)}
                      {plan.product ? ` · ${plan.product.title}` : ""}
                    </span>
                    {plan.todo_total ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="ma-progress__track h-1.5 flex-1"
                          role="progressbar"
                          aria-label={`تقدّم ${plan.title}`}
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span className="ma-progress__bar block h-full" style={{ width: `${percent}%` }} />
                        </span>
                        <span className="text-xs text-fg-muted">
                          {plan.todo_done}/{plan.todo_total}
                        </span>
                      </span>
                    ) : null}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(plan)}
                  aria-label={`تعديل خطة ${plan.title}`}
                  className="ma-btn ma-btn--bare ma-btn--icon m-1 size-9 min-h-9 shrink-0"
                >
                  <Pencil aria-hidden="true" className="size-4 fill-none" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
