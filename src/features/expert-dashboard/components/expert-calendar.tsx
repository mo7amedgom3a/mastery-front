"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKey } from "@/features/consultation-detail/model/availability";
import { StatusTag } from "@/features/orders/components/status-tag";
import { ApiError } from "@/lib/api/client";
import {
  cancelExpertBooking,
  consultationKeys,
  consultationQueries,
  createExpertSlots,
  deleteExpertSlot,
  updateExpertSlot,
  type ExpertSlot,
} from "@/lib/api/consultations";
import { formatLongDate, formatTimeOfDay } from "@/lib/format";

import { bookingStatus } from "@/features/consultations/model/status";

const MINUTE = 60_000;
const MAX_NEW_SLOTS = 12;
/** Paid bookings the expert may still withdraw (the backend also requires that nobody joined yet). */
const CANCELLABLE = new Set(["awaiting_approval", "confirmed"]);

/** One line of the day agenda: a free slot, or every slot one booking holds. */
type AgendaItem = { key: string; slots: ExpertSlot[]; state: ExpertSlot["state"] };

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function timeInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** A local wall-clock time on `day`, as the instant the API expects. */
function localInstant(day: string, time: string): Date {
  return new Date(`${day}T${time}:00`);
}

function agenda(slots: ExpertSlot[]): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const slot of slots) {
    const last = items.at(-1);
    if (slot.booking_id && last?.slots[0].booking_id === slot.booking_id) {
      last.slots.push(slot);
    } else {
      items.push({ key: slot.slot_id, slots: [slot], state: slot.state });
    }
  }
  return items;
}

function conflictMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) return fallback;
  if (error instanceof ApiError && error.status === 422) return "الوقت غير صالح: يجب أن يكون في المستقبل.";
  return "تعذّر الحفظ. تحقّق من اتصالك وحاول مجدداً.";
}

/**
 * The expert's availability as a month calendar. Days with free slots and days with bookings are
 * marked; the chosen day lists its slots, where free ones can be moved or deleted, and paid
 * bookings can be withdrawn (the customer is refunded). Slots a customer is paying for right now
 * are locked until the payment lands or the hold lapses.
 */
export function ExpertCalendar({
  sessionMinutes,
  bookingLeadMinutes = 0,
}: {
  sessionMinutes: number;
  /** Customers only see slots starting at least this many minutes from now. */
  bookingLeadMinutes?: number;
}) {
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const range = {
    from: month.toISOString(),
    to: new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString(),
  };
  const slots = useQuery({
    ...consultationQueries.expertSlots(range),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  const byDay = new Map<string, ExpertSlot[]>();
  for (const slot of slots.data ?? []) {
    const key = dayKey(new Date(slot.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), slot]);
  }
  const hasFree = (date: Date) => byDay.get(dayKey(date))?.some((slot) => slot.state === "free") ?? false;
  const hasBooking = (date: Date) => byDay.get(dayKey(date))?.some((slot) => slot.state !== "free") ?? false;
  const daySlots = byDay.get(selectedDay) ?? [];
  // "Now" as of the last refresh (every 30s): enough to hide actions on slots that already began;
  // the backend refuses them anyway.
  const now = slots.dataUpdatedAt || month.getTime();
  const isPast = selectedDay < dayKey(new Date(now));

  return (
    <section className="flex flex-col gap-4" aria-labelledby="expert-calendar">
      <div className="flex flex-col gap-1">
        <h2 id="expert-calendar" className="m-0 text-lg font-bold">
          تقويم مواعيدك
        </h2>
        <p className="m-0 text-sm text-fg-muted">
          كل موعد مدته {sessionMinutes} دقيقة. اختر يوماً لإضافة مواعيد أو تعديلها أو حذفها. الأوقات بتوقيتك المحلي.
        </p>
      </div>

      <div className="grid gap-6 rounded-panel border border-line p-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col gap-3">
          <Calendar
            mode="single"
            required
            selected={dateFromKey(selectedDay)}
            onSelect={(date) => setSelectedDay(dayKey(date))}
            month={month}
            onMonthChange={(next) => setMonth(monthStart(next))}
            modifiers={{ hasFree, hasBooking }}
            modifiersClassNames={{
              // Marks sit under the number, so state never relies on colour alone.
              hasFree:
                "[&>button]:font-bold [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:start-[calc(50%-0.4rem)] [&>button]:after:size-1.5 [&>button]:after:rounded-full [&>button]:after:border [&>button]:after:border-current [&>button]:after:content-['']",
              hasBooking:
                "[&>button]:font-bold [&>button]:before:absolute [&>button]:before:bottom-1 [&>button]:before:end-[calc(50%-0.4rem)] [&>button]:before:size-1.5 [&>button]:before:rounded-full [&>button]:before:bg-current [&>button]:before:content-['']",
            }}
          />
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg-muted">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full border border-current" />
              مواعيد متاحة
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              حجوزات
            </li>
          </ul>
          {slots.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر تحميل المواعيد.</p> : null}
        </div>

        <DayAgenda
          key={selectedDay}
          day={selectedDay}
          slots={daySlots}
          loading={slots.isPending}
          isPast={isPast}
          now={now}
          sessionMinutes={sessionMinutes}
          bookingLeadMinutes={bookingLeadMinutes}
        />
      </div>
    </section>
  );
}

function DayAgenda({
  day,
  slots,
  loading,
  isPast,
  now,
  sessionMinutes,
  bookingLeadMinutes,
}: {
  day: string;
  slots: ExpertSlot[];
  loading: boolean;
  isPast: boolean;
  now: number;
  sessionMinutes: number;
  bookingLeadMinutes: number;
}) {
  const queryClient = useQueryClient();
  const free = slots.filter((slot) => slot.state === "free");
  const clearDay = useMutation({
    mutationFn: async () => {
      // Each delete is checked on its own: a slot a customer grabbed meanwhile simply stays.
      const results = await Promise.allSettled(free.map((slot) => deleteExpertSlot(slot.slot_id)));
      return results.filter((result) => result.status === "rejected").length;
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:border-s lg:border-line lg:ps-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-base font-bold">{formatLongDate(dateFromKey(day))}</h3>
        {!isPast && free.length > 1 ? (
          confirmClear ? (
            <div className="flex items-center gap-2 text-sm">
              <span>حذف {free.length} مواعيد متاحة؟</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  clearDay.mutate();
                }}
                className="ma-btn ma-btn--secondary ma-btn--sm"
              >
                حذف
              </button>
              <button type="button" onClick={() => setConfirmClear(false)} className="ma-btn ma-btn--ghost ma-btn--sm">
                تراجع
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={clearDay.isPending}
              className="ma-btn ma-btn--ghost ma-btn--sm gap-2 disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              حذف المتاح في هذا اليوم
            </button>
          )
        ) : null}
      </div>
      {clearDay.data ? (
        <p role="status" className="m-0 text-sm text-fg-muted">
          بقي {clearDay.data} من المواعيد لأن عملاء حجزوها للتو.
        </p>
      ) : null}

      {loading ? <Skeleton className="h-24" /> : null}
      {!loading && slots.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">{isPast ? "لا مواعيد في هذا اليوم." : "لا مواعيد بعد في هذا اليوم. أضف مواعيد أدناه."}</p>
      ) : null}
      {slots.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {agenda(slots).map((item) => (
            <li key={item.key}>
              <AgendaRow
                item={item}
                day={day}
                editable={!isPast && Date.parse(item.slots[0].starts_at) > now}
                tooSoon={Date.parse(item.slots[0].starts_at) < now + bookingLeadMinutes * MINUTE}
                wrongLength={
                  item.state === "free" &&
                  Date.parse(item.slots[0].ends_at) - Date.parse(item.slots[0].starts_at) !== sessionMinutes * MINUTE
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      {isPast ? null : <AddSlotsForm day={day} sessionMinutes={sessionMinutes} bookingLeadMinutes={bookingLeadMinutes} />}
    </div>
  );
}

type RowMode = "view" | "edit" | "delete" | "cancel";

function AgendaRow({
  item,
  day,
  editable,
  tooSoon,
  wrongLength,
}: {
  item: AgendaItem;
  day: string;
  editable: boolean;
  /** Starts sooner than customers may book: hidden from them. */
  tooSoon: boolean;
  /** Not one session long (the session length changed): hidden from customers. */
  wrongLength: boolean;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<RowMode>("view");
  const first = item.slots[0];
  const start = new Date(first.starts_at);
  const end = new Date(item.slots.at(-1)!.ends_at);
  const refresh = () => queryClient.invalidateQueries({ queryKey: consultationKeys.all });
  const remove = useMutation({
    mutationFn: () => deleteExpertSlot(first.slot_id),
    onSettled: () => void refresh(),
  });

  return (
    <article className="flex flex-col gap-3 rounded-panel border border-line p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-bold tabular-nums">
            {formatTimeOfDay(start)} – {formatTimeOfDay(end)}
          </span>
          {item.state === "booked" ? (
            <span className="flex flex-wrap items-center gap-2 text-fg-muted">
              {first.customer_name ?? "عميل"}
              {first.booking_status ? <StatusTag status={bookingStatus(first.booking_status)} /> : null}
            </span>
          ) : null}
          {item.state === "held" ? (
            <span className="text-xs text-fg-muted">عميل يُكمل الدفع الآن. يتحرّر الموعد تلقائياً إن لم يكتمل الدفع.</span>
          ) : null}
          {item.state === "free" && wrongLength ? (
            <span className="text-xs text-fg-muted">مدته لا تساوي مدة الجلسة الحالية، فلا يمكن حجزه. احذفه وأضف مواعيد جديدة.</span>
          ) : item.state === "free" && tooSoon && editable ? (
            <span className="text-xs text-fg-muted">يبدأ قريباً جداً: يلزم حجز الموعد قبل بدايته بوقت كافٍ لتأكيده.</span>
          ) : null}
        </div>

        {mode === "view" ? (
          <div className="flex items-center gap-1">
            {item.state === "free" && !tooSoon && !wrongLength ? <span className="ma-tag ma-tag--green">متاح</span> : null}
            {item.state === "free" && (tooSoon || wrongLength) ? (
              <span className="ma-tag ma-tag--soft" title={wrongLength ? "مدته لا تطابق مدة الجلسة الحالية" : "يبدأ قريباً جداً"}>
                غير ظاهر للعملاء
              </span>
            ) : null}
            {item.state === "held" ? <span className="ma-tag ma-tag--yellow">قيد الدفع</span> : null}
            {item.state === "free" && editable ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  aria-label={`تعديل موعد ${formatTimeOfDay(start)}`}
                  className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode("delete")}
                  aria-label={`حذف موعد ${formatTimeOfDay(start)}`}
                  className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </>
            ) : null}
            {item.state === "booked" && editable && first.booking_status && CANCELLABLE.has(first.booking_status) ? (
              <button type="button" onClick={() => setMode("cancel")} className="ma-btn ma-btn--soft ma-btn--sm gap-2">
                <X aria-hidden="true" className="size-4" />
                إلغاء الحجز
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {mode === "delete" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span>حذف هذا الموعد من التقويم؟</span>
          <button
            type="button"
            onClick={() => {
              setMode("view");
              remove.mutate();
            }}
            className="ma-btn ma-btn--secondary ma-btn--sm"
          >
            حذف
          </button>
          <button type="button" onClick={() => setMode("view")} className="ma-btn ma-btn--ghost ma-btn--sm">
            تراجع
          </button>
        </div>
      ) : null}
      {remove.isError ? (
        <p role="alert" className="m-0 text-fg-muted">
          {conflictMessage(remove.error, "حجز عميل هذا الموعد للتو، لذا لم يُحذف. حدّثنا التقويم.")}
        </p>
      ) : null}

      {mode === "edit" ? <EditSlotForm slot={first} day={day} onDone={() => setMode("view")} /> : null}
      {mode === "cancel" ? <CancelBookingForm item={item} onDone={() => setMode("view")} /> : null}
    </article>
  );
}

function EditSlotForm({ slot, day, onDone }: { slot: ExpertSlot; day: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const timeId = useId();
  const start = new Date(slot.starts_at);
  const length = new Date(slot.ends_at).getTime() - start.getTime();
  const [time, setTime] = useState(() => timeInput(start));
  const save = useMutation({
    mutationFn: () => {
      const next = localInstant(day, time);
      return updateExpertSlot(slot.slot_id, {
        starts_at: next.toISOString(),
        ends_at: new Date(next.getTime() + length).toISOString(),
      });
    },
    onSuccess: onDone,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={timeId} className="text-xs font-bold">
          وقت البداية الجديد
        </label>
        <input
          id={timeId}
          type="time"
          required
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="rounded-panel border border-line bg-surface p-2"
        />
      </div>
      <button type="submit" disabled={save.isPending} className="ma-btn ma-btn--primary ma-btn--sm disabled:opacity-50">
        حفظ
      </button>
      <button type="button" onClick={onDone} className="ma-btn ma-btn--ghost ma-btn--sm">
        تراجع
      </button>
      {save.isError ? (
        <p role="alert" className="m-0 basis-full text-fg-muted">
          {conflictMessage(save.error, "يتداخل الوقت الجديد مع موعد آخر، أو حجز عميل هذا الموعد للتو.")}
        </p>
      ) : null}
    </form>
  );
}

function CancelBookingForm({ item, onDone }: { item: AgendaItem; onDone: () => void }) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [slotsAfter, setSlotsAfter] = useState<"release" | "remove">("release");
  const bookingId = item.slots[0].booking_id!;
  const cancel = useMutation({
    mutationFn: () => cancelExpertBooking(bookingId, { reason: reason.trim() || null, slots: slotsAfter }),
    onSuccess: onDone,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    cancel.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-line pt-3">
      <p className="m-0 leading-6">
        سيُبلَّغ العميل بالبريد ويُردّ إليه المبلغ كاملاً.
        {item.slots.length > 1 ? ` يشمل الإلغاء ${item.slots.length} مواعيد متتالية.` : null}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={reasonId} className="font-bold">
          رسالة للعميل (اختياري)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          maxLength={500}
          rows={2}
          onChange={(event) => setReason(event.target.value)}
          className="rounded-panel border border-line bg-surface p-3"
        />
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 p-0 font-bold">بعد الإلغاء</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`after-${bookingId}`}
            checked={slotsAfter === "release"}
            onChange={() => setSlotsAfter("release")}
          />
          أتِح الوقت لعملاء آخرين
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`after-${bookingId}`}
            checked={slotsAfter === "remove"}
            onChange={() => setSlotsAfter("remove")}
          />
          احذف الوقت من تقويمي
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={cancel.isPending} className="ma-btn ma-btn--secondary ma-btn--sm disabled:opacity-50">
          تأكيد الإلغاء
        </button>
        <button type="button" onClick={onDone} className="ma-btn ma-btn--ghost ma-btn--sm">
          تراجع
        </button>
      </div>
      {cancel.isError ? (
        <p role="alert" className="m-0 text-fg-muted">
          {conflictMessage(cancel.error, "لم يعد ممكناً إلغاء هذا الحجز: بدأت الجلسة أو تغيّرت حالته.")}
        </p>
      ) : null}
    </form>
  );
}

function AddSlotsForm({
  day,
  sessionMinutes,
  bookingLeadMinutes,
}: {
  day: string;
  sessionMinutes: number;
  bookingLeadMinutes: number;
}) {
  const queryClient = useQueryClient();
  const timeId = useId();
  const [time, setTime] = useState("18:00");
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => {
      const first = localInstant(day, time);
      const windows = Array.from({ length: count }, (_, index) => {
        const start = new Date(first.getTime() + index * sessionMinutes * MINUTE);
        return { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + sessionMinutes * MINUTE).toISOString() };
      });
      return createExpertSlots({ slots: windows, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" });
    },
    onSuccess: (result) => {
      if (result.created === count) setMessage(count === 1 ? "أُضيف الموعد." : `أُضيفت ${count} مواعيد.`);
      else if (result.created === 0) setMessage("لم يُضف شيء: الأوقات موجودة مسبقاً أو تتداخل مع مواعيد أخرى.");
      else setMessage(`أُضيفت ${result.created} من ${count}؛ تخطّينا الأوقات المتداخلة.`);
    },
    onError: (error) => setMessage(conflictMessage(error, "تعذّرت إضافة المواعيد.")),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    create.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={timeId} className="text-sm font-bold">
          من الساعة
        </label>
        <input
          id={timeId}
          type="time"
          required
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="rounded-panel border border-line bg-surface p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold">عدد المواعيد المتتالية</span>
        <div className="flex items-center gap-2" role="group" aria-label="عدد المواعيد المتتالية">
          <button
            type="button"
            onClick={() => setCount((value) => Math.max(1, value - 1))}
            disabled={count <= 1}
            aria-label="أقل"
            className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9 disabled:opacity-30"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <output aria-live="polite" className="min-w-6 text-center font-bold tabular-nums">
            {count}
          </output>
          <button
            type="button"
            onClick={() => setCount((value) => Math.min(MAX_NEW_SLOTS, value + 1))}
            disabled={count >= MAX_NEW_SLOTS}
            aria-label="أكثر"
            className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9 disabled:opacity-30"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <button type="submit" disabled={create.isPending} className="ma-btn ma-btn--primary ma-btn--sm gap-2 disabled:opacity-50">
        <CalendarPlus aria-hidden="true" className="size-4" />
        إضافة
      </button>
      {bookingLeadMinutes > 0 ? (
        <p className="m-0 basis-full text-xs text-fg-muted">
          يرى العملاء المواعيد التي تبدأ بعد {bookingLeadMinutes} دقيقة على الأقل من الآن، ليتسع وقت لتأكيد الحجز.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="m-0 basis-full text-sm text-fg-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}

/** The calendar page: the session length comes from the expert's profile. */
export function ExpertCalendarPage() {
  const profile = useQuery(consultationQueries.expert());
  if (!profile.isSuccess) return <Skeleton className="h-96" />;
  return (
    <ExpertCalendar
      sessionMinutes={profile.data.session_minutes}
      bookingLeadMinutes={profile.data.booking_lead_minutes ?? 0}
    />
  );
}
