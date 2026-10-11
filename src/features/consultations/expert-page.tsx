"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  approveBooking,
  consultationKeys,
  consultationQueries,
  createExpertSlots,
  deleteExpertSlot,
  rejectBooking,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatDateTime, formatLongDate, formatTimeOfDay } from "@/lib/format";

import { BookingRow } from "./consultations-page";
import { isUpcoming } from "./model/status";

const MINUTE = 60_000;

/** The expert's area: bookings waiting for approval, upcoming and past sessions, and open slots. */
export function ExpertPage() {
  const profile = useQuery(consultationQueries.expert());

  if (profile.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-28" />
      </div>
    );
  }
  if (profile.isError) {
    const forbidden = profile.error instanceof ApiError && profile.error.status === 403;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{forbidden ? "هذا الحساب غير مرتبط بخبير" : "تعذّر التحميل"}</p>
          <p className="ma-alert__text">
            {forbidden ? "تواصل مع فريق ماستري لربط حسابك بملف الخبير." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <ExpertBookings />
      <SlotManager sessionMinutes={profile.data.session_minutes} />
    </div>
  );
}

function ExpertBookings() {
  const bookings = useQuery({ ...consultationQueries.expertBookings(), refetchInterval: 20_000 });
  if (bookings.isPending) return <Skeleton className="h-28" />;
  if (bookings.isError) {
    return <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الحجوزات.</p>;
  }
  const pending = bookings.data.filter((booking) => booking.status === "awaiting_approval");
  const upcoming = bookings.data.filter((booking) => isUpcoming(booking.status) && booking.status !== "awaiting_approval");
  const past = bookings.data.filter((booking) => !isUpcoming(booking.status));

  return (
    <>
      <section className="flex flex-col gap-3" aria-labelledby="expert-pending">
        <h2 id="expert-pending" className="m-0 text-lg font-bold">
          بانتظار موافقتك
        </h2>
        {pending.length === 0 ? (
          <p className="m-0 text-sm text-fg-muted">لا توجد طلبات جديدة.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {pending.map((booking) => (
              <li key={booking.booking_id}>
                <ApprovalCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <BookingSection title="الجلسات القادمة" bookings={upcoming.toReversed()} empty="لا توجد جلسات قادمة." />
      {past.length > 0 ? <BookingSection title="الجلسات السابقة" bookings={past} /> : null}
    </>
  );
}

function BookingSection({ title, bookings, empty }: { title: string; bookings: ConsultationBooking[]; empty?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-lg font-bold">{title}</h2>
      {bookings.length === 0 && empty ? <p className="m-0 text-sm text-fg-muted">{empty}</p> : null}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {bookings.map((booking) => (
          <li key={booking.booking_id}>
            <BookingRow booking={booking} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ApprovalCard({ booking }: { booking: ConsultationBooking }) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reasonId = useId();
  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      approve ? approveBooking(booking.booking_id) : rejectBooking(booking.booking_id, reason.trim() || null),
    onSettled: () => {
      // The workflow applies the decision within moments; refresh shortly after.
      setTimeout(() => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }), 1500);
    },
  });

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-base font-bold">{booking.product_title ?? "استشارة"}</h3>
        <p className="m-0 text-sm text-fg-muted">
          {booking.customer_name ? `${booking.customer_name} · ` : null}
          {booking.scheduled_start_at ? formatDateTime(booking.scheduled_start_at) : null}
          {booking.duration_minutes ? ` · ${booking.duration_minutes} دقيقة` : null}
        </p>
        {booking.approval_deadline_at ? (
          <p className="m-0 text-xs text-fg-muted">
            يُلغى الحجز ويُردّ المبلغ للعميل إن لم تؤكّده قبل {formatDateTime(booking.approval_deadline_at)}.
          </p>
        ) : null}
      </div>
      {decide.isSuccess ? (
        <p role="status" className="m-0 text-sm font-bold">
          تم إرسال قرارك.
        </p>
      ) : rejecting ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={reasonId} className="text-sm font-bold">
            سبب الاعتذار (اختياري)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            className="rounded-panel border border-line bg-surface p-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide.mutate(false)}
              disabled={decide.isPending}
              className="ma-btn ma-btn--secondary ma-btn--sm disabled:opacity-50"
            >
              تأكيد الاعتذار
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="ma-btn ma-btn--ghost ma-btn--sm">
              تراجع
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide.mutate(true)}
            disabled={decide.isPending}
            className="ma-btn ma-btn--primary ma-btn--sm gap-2 disabled:opacity-50"
          >
            <Check aria-hidden="true" className="size-4" />
            تأكيد الموعد
          </button>
          <button type="button" onClick={() => setRejecting(true)} className="ma-btn ma-btn--soft ma-btn--sm gap-2">
            <X aria-hidden="true" className="size-4" />
            اعتذار
          </button>
        </div>
      )}
      {decide.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر إرسال القرار. حدّث الصفحة وحاول مجدداً.</p> : null}
    </article>
  );
}

function localDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Open bookable slots: each lasts one session; several in a row allow longer bookings. */
function SlotManager({ sessionMinutes }: { sessionMinutes: number }) {
  const queryClient = useQueryClient();
  const slots = useQuery(consultationQueries.expertSlots());
  const dateId = useId();
  const timeId = useId();
  const countId = useId();
  const [date, setDate] = useState(() => localDateInput(new Date(Date.now() + 24 * 60 * MINUTE)));
  const [time, setTime] = useState("18:00");
  const [count, setCount] = useState(2);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: consultationKeys.all });
  const create = useMutation({
    mutationFn: () => {
      // Local wall-clock time in the expert's browser, sent as UTC instants.
      const first = new Date(`${date}T${time}:00`);
      const windows = Array.from({ length: count }, (_, index) => {
        const start = new Date(first.getTime() + index * sessionMinutes * MINUTE);
        return { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + sessionMinutes * MINUTE).toISOString() };
      });
      return createExpertSlots({ slots: windows, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" });
    },
    onSuccess: (result) => {
      setMessage(result.created > 0 ? `أُضيفت ${result.created} من المواعيد.` : "هذه المواعيد موجودة مسبقاً أو تتداخل مع مواعيد أخرى.");
      void refresh();
    },
    onError: () => setMessage("تعذّر إضافة المواعيد. تأكّد أن الوقت في المستقبل."),
  });
  const remove = useMutation({ mutationFn: (slotId: string) => deleteExpertSlot(slotId), onSettled: () => void refresh() });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    create.mutate();
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="expert-slots">
      <div className="flex flex-col gap-1">
        <h2 id="expert-slots" className="m-0 text-lg font-bold">
          مواعيدك المتاحة
        </h2>
        <p className="m-0 text-sm text-fg-muted">
          كل موعد مدته {sessionMinutes} دقيقة. أضف مواعيد متتالية ليتمكّن العملاء من حجز جلسات أطول.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-panel border border-line p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={dateId} className="text-sm font-bold">
            اليوم
          </label>
          <input id={dateId} type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="rounded-panel border border-line bg-surface p-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={timeId} className="text-sm font-bold">
            وقت البداية
          </label>
          <input id={timeId} type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="rounded-panel border border-line bg-surface p-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={countId} className="text-sm font-bold">
            عدد المواعيد المتتالية
          </label>
          <input
            id={countId}
            type="number"
            min={1}
            max={12}
            required
            value={count}
            onChange={(event) => setCount(Math.max(1, Math.min(12, Number(event.target.value) || 1)))}
            className="w-24 rounded-panel border border-line bg-surface p-2"
          />
        </div>
        <button type="submit" disabled={create.isPending} className="ma-btn ma-btn--primary ma-btn--sm disabled:opacity-50">
          إضافة
        </button>
        {message ? (
          <p role="status" className="m-0 basis-full text-sm text-fg-muted">
            {message}
          </p>
        ) : null}
      </form>

      {slots.isPending ? <Skeleton className="h-24" /> : null}
      {slots.isSuccess && slots.data.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">لا توجد مواعيد خلال الثلاثين يوماً القادمة.</p>
      ) : null}
      {slots.isSuccess && slots.data.length > 0 ? (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {slots.data.map((slot) => {
            const start = new Date(slot.starts_at);
            return (
              <li key={slot.slot_id} className="flex items-center justify-between gap-2 rounded-panel border border-line p-3 text-sm">
                <span>
                  <span className="font-bold">{formatLongDate(start)}</span>
                  <br />
                  <span className="tabular-nums">
                    {formatTimeOfDay(start)} – {formatTimeOfDay(new Date(slot.ends_at))}
                  </span>
                </span>
                {slot.is_available ? (
                  <button
                    type="button"
                    onClick={() => remove.mutate(slot.slot_id)}
                    disabled={remove.isPending}
                    aria-label="حذف الموعد"
                    className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                ) : (
                  <span className="ma-tag ma-tag--yellow">محجوز</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
