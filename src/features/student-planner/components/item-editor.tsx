"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  createPlannerItem,
  deletePlannerItem,
  plannerKeys,
  updatePlannerItem,
  type CreatePlannerItemRequest,
  type PlannerEvent,
  type PlannerItemKind,
  type PlannerPlan,
} from "@/lib/api/planner";
import { cn } from "@/lib/cn";

import { browserTimezone, combine, dayKey, REMINDER_OPTIONS, SOURCE_META, timeValue } from "../model/calendar";
import { PlannerDialog } from "./planner-dialog";
import { ProductPicker, type PickedProduct } from "./product-picker";

const KINDS: readonly PlannerItemKind[] = ["todo", "study", "note"];
const KIND_HINTS: Record<PlannerItemKind, string> = {
  todo: "شيء تنجزه في هذا اليوم، وتشطبه عند الانتهاء.",
  study: "وقت محجوز للتعلّم، يمكنك ربطه بكورس أو دبلومة.",
  note: "ملاحظة تثبّتها على هذا اليوم.",
};

export type ItemEditorTarget =
  | {
      mode: "create";
      day: string;
      kind?: PlannerItemKind;
      planId?: string | null;
    }
  | { mode: "edit"; event: PlannerEvent };

type Extra = { reminder_minutes_before?: number | null };

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return "وصلت إلى الحد الأقصى لعناصر التقويم.";
  if (error instanceof ApiError && error.status === 422) return "تحقّق من البيانات: العنوان مطلوب، ووقت النهاية بعد البداية.";
  return "تعذّر الحفظ حالياً، حاول مرة أخرى.";
}

export function ItemEditor({ target, plans, onClose }: { target: ItemEditorTarget; plans: readonly PlannerPlan[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const ids = {
    title: useId(),
    body: useId(),
    day: useId(),
    start: useId(),
    end: useId(),
    plan: useId(),
    reminder: useId(),
  };
  const editing = target.mode === "edit" ? target.event : null;
  const start = editing ? new Date(editing.starts_at) : null;
  const end = editing?.ends_at ? new Date(editing.ends_at) : null;

  const [kind, setKind] = useState<PlannerItemKind>(
    editing ? (editing.source as PlannerItemKind) : target.mode === "create" ? (target.kind ?? "todo") : "todo",
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.subtitle ?? "");
  const [day, setDay] = useState(start ? dayKey(start) : target.mode === "create" ? target.day : dayKey(new Date()));
  const [allDay, setAllDay] = useState(editing ? editing.all_day : true);
  const [startTime, setStartTime] = useState(start && !editing?.all_day ? timeValue(start) : "18:00");
  const [endTime, setEndTime] = useState(end && !editing?.all_day ? timeValue(end) : "");
  const [planId, setPlanId] = useState<string>(editing?.plan_id ?? (target.mode === "create" ? (target.planId ?? "") : ""));
  const [product, setProduct] = useState<PickedProduct | null>(
    editing?.product
      ? {
          product_id: editing.product.product_id,
          title: editing.product.title,
          product_type: editing.product.product_type,
          slug: editing.product.slug,
        }
      : null,
  );
  const [reminder, setReminder] = useState<number | null>(editing ? ((editing.extra as Extra).reminder_minutes_before ?? null) : null);
  const [problem, setProblem] = useState<string | null>(null);

  const done = () => {
    void queryClient.invalidateQueries({ queryKey: plannerKeys.all });
  };
  const save = useMutation({
    mutationFn: (payload: CreatePlannerItemRequest) =>
      editing?.reference_id ? updatePlannerItem(editing.reference_id, payload) : createPlannerItem(payload),
    onSuccess: () => {
      done();
      onClose();
    },
    onError: (error) => setProblem(errorText(error)),
  });
  const remove = useMutation({
    mutationFn: () => deletePlannerItem(editing?.reference_id ?? ""),
    onSuccess: () => {
      done();
      onClose();
    },
    onError: () => setProblem("تعذّر الحذف حالياً."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setProblem(null);
    if (!title.trim()) {
      setProblem("اكتب عنواناً.");
      return;
    }
    const startsAt = allDay ? combine(day, "00:00") : combine(day, startTime);
    const endsAt = !allDay && endTime ? combine(day, endTime) : null;
    if (endsAt && endsAt <= startsAt) {
      setProblem("وقت النهاية يجب أن يكون بعد وقت البداية.");
      return;
    }
    // An all-day reminder fires relative to 9 AM local, not midnight.
    const reminderBase = allDay ? combine(day, "09:00") : startsAt;
    save.mutate({
      kind,
      title: title.trim(),
      body: body.trim() || null,
      all_day: allDay,
      starts_at: (allDay && reminder !== null ? reminderBase : startsAt).toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      timezone_name: browserTimezone(),
      product_id: product?.product_id ?? null,
      plan_id: planId || null,
      reminder_minutes_before: reminder as CreatePlannerItemRequest["reminder_minutes_before"],
      // Only todos can be done; switching an item to another kind clears it on the server too.
      is_done: kind === "todo" && Boolean(editing?.is_done),
    });
  };

  return (
    <PlannerDialog title={editing ? "تعديل العنصر" : "إضافة إلى التقويم"} subtitle={KIND_HINTS[kind]} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div role="tablist" aria-label="نوع العنصر" className="ma-tabs">
          {KINDS.map((option) => {
            const Icon = SOURCE_META[option].icon;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={kind === option}
                onClick={() => setKind(option)}
                className="flex items-center gap-2"
              >
                <Icon aria-hidden="true" className="size-4 fill-none" />
                {SOURCE_META[option].label}
              </button>
            );
          })}
        </div>

        <div className="ma-field">
          <label htmlFor={ids.title} className="ma-label">
            العنوان
          </label>
          <input
            id={ids.title}
            className="ma-input"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="ma-field">
          <label htmlFor={ids.body} className="ma-label">
            {kind === "note" ? "الملاحظة" : "تفاصيل (اختياري)"}
          </label>
          <textarea id={ids.body} className="ma-input min-h-24" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="ma-field">
            <label htmlFor={ids.day} className="ma-label">
              اليوم
            </label>
            <input
              id={ids.day}
              type="date"
              className="ma-input"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              required
            />
          </div>
          <label className="ma-check self-end pb-3">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <span>طوال اليوم</span>
          </label>
        </div>

        {!allDay ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ma-field">
              <label htmlFor={ids.start} className="ma-label">
                من
              </label>
              <input
                id={ids.start}
                type="time"
                className="ma-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="ma-field">
              <label htmlFor={ids.end} className="ma-label">
                إلى (اختياري)
              </label>
              <input id={ids.end} type="time" className="ma-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        ) : null}

        <div className="ma-field">
          <span className="ma-label">ربط بكورس أو منتج (اختياري)</span>
          <ProductPicker value={product} onChange={setProduct} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="ma-field">
            <label htmlFor={ids.plan} className="ma-label">
              ضمن خطة
            </label>
            <select id={ids.plan} className="ma-select" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">بدون خطة</option>
              {plans.map((plan) => (
                <option key={plan.plan_id} value={plan.plan_id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </div>
          <div className="ma-field">
            <label htmlFor={ids.reminder} className="ma-label">
              تذكير بالبريد
            </label>
            <select
              id={ids.reminder}
              className="ma-select"
              value={reminder === null ? "" : String(reminder)}
              onChange={(e) => setReminder(e.target.value === "" ? null : Number(e.target.value))}
            >
              {REMINDER_OPTIONS.map((option) => (
                <option key={option.label} value={option.value === null ? "" : String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {reminder !== null && allDay ? (
          <p className="m-0 text-xs text-fg-muted">تذكير العناصر طوال اليوم يُحسب من الساعة 9 صباحاً.</p>
        ) : null}

        {problem ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm font-medium">
            {problem}
          </p>
        ) : null}

        <div className={cn("flex flex-wrap items-center gap-3", editing ? "justify-between" : "justify-end")}>
          {editing ? (
            <Button variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
              <Trash2 aria-hidden="true" className="size-4 fill-none" />
              حذف
            </Button>
          ) : null}
          <div className="flex gap-3">
            <Button variant="soft" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
          </div>
        </div>
      </form>
    </PlannerDialog>
  );
}
