"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ApiError } from "@/lib/api/client";
import { createPlannerPlan, deletePlannerPlan, plannerKeys, updatePlannerPlan, type PlannerPlan } from "@/lib/api/planner";
import { cn } from "@/lib/cn";
import { formatCalendarDate } from "@/lib/format";

import { addDays, dateFromKey, dayKey, PLAN_COLORS, planSwatch, type PlanColor } from "../model/calendar";
import { PlannerDialog } from "./planner-dialog";
import { ProductPicker, type PickedProduct } from "./product-picker";

export type PlanEditorTarget = { mode: "create"; day: string } | { mode: "edit"; plan: PlannerPlan };

const COLOR_LABELS: Record<PlanColor, string> = {
  lilac: "بنفسجي",
  sky: "سماوي",
  green: "أخضر",
  yellow: "أصفر",
  pink: "وردي",
  teal: "فيروزي",
};

export function PlanEditor({ target, onClose }: { target: PlanEditorTarget; onClose: () => void }) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const goalId = useId();
  const plan = target.mode === "edit" ? target.plan : null;
  const firstDay = plan ? plan.starts_on : target.mode === "create" ? target.day : dayKey(new Date());

  const [title, setTitle] = useState(plan?.title ?? "");
  const [goal, setGoal] = useState(plan?.goal ?? "");
  const [range, setRange] = useState<DateRange | undefined>({
    from: dateFromKey(firstDay),
    to: plan ? dateFromKey(plan.ends_on) : addDays(dateFromKey(firstDay), 13),
  });
  const [color, setColor] = useState<PlanColor>((plan?.color as PlanColor) ?? "lilac");
  const [product, setProduct] = useState<PickedProduct | null>(
    plan?.product
      ? {
          product_id: plan.product.product_id,
          title: plan.product.title,
          product_type: plan.product.product_type,
          slug: plan.product.slug,
        }
      : null,
  );
  const [problem, setProblem] = useState<string | null>(null);

  const finish = () => {
    void queryClient.invalidateQueries({ queryKey: plannerKeys.all });
    onClose();
  };
  const save = useMutation({
    mutationFn: (body: {
      title: string;
      goal: string | null;
      starts_on: string;
      ends_on: string;
      color: string;
      product_id: string | null;
    }) => (plan ? updatePlannerPlan(plan.plan_id, body) : createPlannerPlan(body)),
    onSuccess: finish,
    onError: (error) =>
      setProblem(
        error instanceof ApiError && error.status === 409
          ? "وصلت إلى الحد الأقصى للخطط النشطة."
          : error instanceof ApiError && error.status === 422
            ? "تحقّق من المدة: لا تتجاوز سنة واحدة."
            : "تعذّر الحفظ حالياً.",
      ),
  });
  const complete = useMutation({
    mutationFn: (status: "completed" | "active" | "archived") => updatePlannerPlan(plan?.plan_id ?? "", { status }),
    onSuccess: finish,
  });
  const remove = useMutation({
    mutationFn: () => deletePlannerPlan(plan?.plan_id ?? ""),
    onSuccess: finish,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setProblem(null);
    if (!title.trim()) return setProblem("اكتب اسماً للخطة.");
    if (!range?.from) return setProblem("اختر مدة الخطة من التقويم.");
    const to = range.to ?? range.from;
    save.mutate({
      title: title.trim(),
      goal: goal.trim() || null,
      starts_on: dayKey(range.from),
      ends_on: dayKey(to),
      color,
      product_id: product?.product_id ?? null,
    });
  };

  return (
    <PlannerDialog
      title={plan ? "تعديل خطة التعلّم" : "خطة تعلّم جديدة"}
      subtitle="حدّد هدفاً ومدة، ثم أضف إليها مهام ووقت تعلّم في أيامها."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="ma-field">
          <label htmlFor={titleId} className="ma-label">
            اسم الخطة
          </label>
          <input
            id={titleId}
            className="ma-input"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: إنهاء دبلومة التسويق الرقمي"
            autoFocus
          />
        </div>
        <div className="ma-field">
          <label htmlFor={goalId} className="ma-label">
            الهدف (اختياري)
          </label>
          <textarea id={goalId} className="ma-input min-h-20" value={goal} maxLength={2000} onChange={(e) => setGoal(e.target.value)} />
        </div>

        <div className="ma-field">
          <span className="ma-label">المدة</span>
          <div className="rounded-panel border border-line p-2">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              defaultMonth={range?.from}
              classNames={{
                range_middle: "[&>button]:bg-surface-alt [&>button]:text-fg [&>button]:border-transparent",
              }}
            />
          </div>
          <p className="m-0 text-sm text-fg-muted" aria-live="polite">
            {range?.from
              ? `من ${formatCalendarDate(dayKey(range.from))} إلى ${formatCalendarDate(dayKey(range.to ?? range.from))}`
              : "اختر يوم البداية ثم يوم النهاية."}
          </p>
        </div>

        <div className="ma-field">
          <span className="ma-label">ربط بكورس أو دبلومة (اختياري)</span>
          <ProductPicker value={product} onChange={setProduct} />
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="ma-label mb-2">اللون</legend>
          <div className="flex flex-wrap gap-2">
            {PLAN_COLORS.map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  type="radio"
                  name="plan-color"
                  value={option}
                  checked={color === option}
                  onChange={() => setColor(option)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block size-9 rounded-full border-2 border-transparent peer-checked:border-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                    planSwatch(option),
                  )}
                />
                <span className="sr-only">{COLOR_LABELS[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {problem ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm font-medium">
            {problem}
          </p>
        ) : null}

        <div className={cn("flex flex-wrap items-center gap-3", plan ? "justify-between" : "justify-end")}>
          {plan ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => complete.mutate(plan.status === "completed" ? "active" : "completed")}>
                {plan.status === "completed" ? "إعادة تفعيل" : "تم إنجاز الخطة"}
              </Button>
              <Button variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
                <Trash2 aria-hidden="true" className="size-4 fill-none" />
                حذف
              </Button>
            </div>
          ) : null}
          <div className="flex gap-3">
            <Button variant="soft" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "جارٍ الحفظ…" : "حفظ الخطة"}
            </Button>
          </div>
        </div>
      </form>
    </PlannerDialog>
  );
}
