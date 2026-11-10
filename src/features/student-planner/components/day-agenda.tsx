"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { plannerKeys, updatePlannerItem, type PlannerCalendar, type PlannerEvent, type PlannerItemKind } from "@/lib/api/planner";
import { productHref } from "@/lib/catalog/product-href";
import { cn } from "@/lib/cn";
import { formatCalendarDate, formatLongDate, formatTimeOfDay } from "@/lib/format";

import { agendaOrder, dateFromKey, eventDays, isRange, planSwatch, SOURCE_META } from "../model/calendar";
import { productTypeLabel } from "./product-picker";

const BOOKING_STATUS: Record<string, string> = {
  awaiting_approval: "بانتظار موافقة الخبير",
  confirmed: "مؤكدة",
  in_progress: "جارية الآن",
  completed: "انتهت",
  no_show_customer: "لم تحضر",
  no_show_expert: "لم يحضر الخبير",
};

function timeLabel(event: PlannerEvent): string {
  if (isRange(event)) {
    const [first, last] = eventDays(event);
    return `${formatCalendarDate(first)} – ${formatCalendarDate(last)}`;
  }
  if (event.all_day) return "طوال اليوم";
  const start = formatTimeOfDay(new Date(event.starts_at));
  return event.ends_at ? `${start} – ${formatTimeOfDay(new Date(event.ends_at))}` : start;
}

function useToggleTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) => updatePlannerItem(itemId, { is_done: done }),
    onMutate: async ({ itemId, done }) => {
      await queryClient.cancelQueries({ queryKey: plannerKeys.calendars() });
      const snapshot = queryClient.getQueriesData<PlannerCalendar>({
        queryKey: plannerKeys.calendars(),
      });
      queryClient.setQueriesData<PlannerCalendar>({ queryKey: plannerKeys.calendars() }, (data) =>
        data
          ? {
              ...data,
              events: data.events.map((e) => (e.reference_id === itemId && e.source === "todo" ? { ...e, is_done: done } : e)),
            }
          : data,
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: plannerKeys.all }),
  });
}

function EventCard({
  event,
  onEdit,
  onEditPlan,
}: {
  event: PlannerEvent;
  onEdit: (event: PlannerEvent) => void;
  onEditPlan: (planId: string) => void;
}) {
  const toggle = useToggleTodo();
  const meta = SOURCE_META[event.source];
  const Icon = meta.icon;
  const swatch = event.source === "plan" ? planSwatch((event.extra as { color?: string }).color) : meta.swatch;
  const product = event.product;
  const productLink = product ? productHref(product, product.title) : null;
  const done = event.source === "todo" && Boolean(event.is_done);
  const progress = event.source === "plan" ? (event.extra as { todo_total?: number; todo_done?: number }) : null;

  return (
    <li className="relative flex gap-3 overflow-hidden rounded-panel border border-line bg-surface p-3 ps-4">
      <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 w-1.5", swatch)} />
      {event.source === "todo" && event.reference_id ? (
        <label className="ma-check mt-0.5 shrink-0 self-start">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) =>
              toggle.mutate({
                itemId: event.reference_id ?? "",
                done: e.target.checked,
              })
            }
            aria-label={done ? `إلغاء إنجاز: ${event.title}` : `إنجاز: ${event.title}`}
          />
        </label>
      ) : (
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 fill-none text-fg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
          <span className="font-bold text-fg">{meta.label}</span>
          <span>{timeLabel(event)}</span>
          {event.source === "consultation" && event.status ? <span>· {BOOKING_STATUS[event.status] ?? event.status}</span> : null}
          {event.source === "plan" && event.status === "completed" ? <span>· منجزة</span> : null}
        </div>
        <p className={cn("m-0 font-medium break-words", done && "text-fg-muted line-through")}>{event.title}</p>
        {event.subtitle ? <p className="m-0 line-clamp-3 text-sm whitespace-pre-line text-fg-muted">{event.subtitle}</p> : null}
        {progress && progress.todo_total ? (
          <p className="m-0 text-xs text-fg-muted">
            المهام: {progress.todo_done ?? 0} من {progress.todo_total}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {product ? (
            productLink ? (
              <AppLink href={productLink} className="font-medium underline-offset-4 hover:underline">
                {product.title} <span className="text-xs text-fg-muted">({productTypeLabel(product.product_type)})</span>
              </AppLink>
            ) : (
              <span>{product.title}</span>
            )
          ) : null}
          {event.source === "live_session" && event.meeting_url ? (
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-fg underline-offset-4 hover:underline"
            >
              رابط المحاضرة
              <ExternalLink aria-hidden="true" className="size-3.5 fill-none" />
            </a>
          ) : null}
          {event.source === "consultation" && event.reference_id ? (
            <AppLink
              href={routes.studentConsultation(event.reference_id) as Route}
              className="font-medium underline-offset-4 hover:underline"
            >
              تفاصيل الاستشارة
            </AppLink>
          ) : null}
        </div>
      </div>
      {event.editable ? (
        <button
          type="button"
          onClick={() => (event.source === "plan" && event.plan_id ? onEditPlan(event.plan_id) : onEdit(event))}
          className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9 shrink-0 self-start"
          aria-label={`تعديل: ${event.title}`}
        >
          <Pencil aria-hidden="true" className="size-4 fill-none" />
        </button>
      ) : null}
    </li>
  );
}

export function DayAgenda({
  day,
  events,
  loading,
  onAdd,
  onEdit,
  onEditPlan,
}: {
  day: string;
  events: readonly PlannerEvent[];
  loading: boolean;
  onAdd: (kind: PlannerItemKind) => void;
  onEdit: (event: PlannerEvent) => void;
  onEditPlan: (planId: string) => void;
}) {
  const sorted = [...events].sort(agendaOrder);
  return (
    <section aria-labelledby="planner-day-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="planner-day-title" className="m-0 text-lg font-bold">
          {formatLongDate(dateFromKey(day))}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onAdd("todo")}>
            <Plus aria-hidden="true" className="size-4" />
            مهمة
          </Button>
          <Button size="sm" variant="soft" onClick={() => onAdd("study")}>
            <Plus aria-hidden="true" className="size-4" />
            وقت تعلّم
          </Button>
          <Button size="sm" variant="soft" onClick={() => onAdd("note")}>
            <Plus aria-hidden="true" className="size-4" />
            ملاحظة
          </Button>
        </div>
      </div>
      {loading ? (
        <p role="status" className="m-0 text-sm text-fg-muted">
          جارٍ تحميل اليوم…
        </p>
      ) : sorted.length === 0 ? (
        <div className="rounded-panel border border-dashed border-line-strong p-6 text-center">
          <p className="m-0 font-medium">لا شيء في هذا اليوم بعد.</p>
          <p className="m-0 mt-1 text-sm text-fg-muted">أضف مهمة أو وقتاً للتعلّم، أو ثبّت ملاحظة لتعود إليها.</p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {sorted.map((event) => (
            <EventCard key={event.id} event={event} onEdit={onEdit} onEditPlan={onEditPlan} />
          ))}
        </ul>
      )}
    </section>
  );
}
