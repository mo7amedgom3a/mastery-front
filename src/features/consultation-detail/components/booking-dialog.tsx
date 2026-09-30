"use client";

import { clsx as cn } from "clsx";
import { ArrowRight, CalendarX, Info, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { routes } from "@/config/routes";
import { formatLongDate, formatTimeOfDay } from "@/lib/format";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

import { buildSlots, dayKey, pendingSlotKey } from "../model/availability";
import { sessionsLabel } from "../model/facts";
import type { BookingVM, SlotVM } from "../model/types";

type Step = "pick" | "signin" | "summary";

type BookingDialogProps = {
  booking: BookingVM;
  /** Slot to reopen on (ISO start), e.g. after the visitor signed in. */
  initialStart: string | null;
  onClose: () => void;
};

function localTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Booking flow in a modal: pick a day on the calendar, then a time, then confirm. Guests are asked
 * to sign in first; signed-in visitors get a summary of the appointment.
 *
 * MOCK: availability is generated (see `mock-availability.ts`) and nothing is saved.
 * TODO(api): create the booking and hand over to payment from the summary step.
 */
export default function BookingDialog({ booking, initialStart, onClose }: BookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const timesId = useId();
  // Mounted when opened, so "now" is the moment the visitor opened the calendar.
  const [now] = useState(() => new Date());
  const days = useMemo(() => buildSlots(booking.availability, booking.id, now), [booking, now]);
  const freeDays = useMemo(
    () => [...days].filter(([, slots]) => slots.some((slot) => !slot.taken)).map(([key]) => key),
    [days],
  );
  const freeDaySet = useMemo(() => new Set(freeDays), [freeDays]);

  const restored = useMemo(() => {
    if (!initialStart) return null;
    const key = dayKey(new Date(initialStart));
    return days.get(key)?.some((slot) => slot.start === initialStart && !slot.taken) ? key : null;
  }, [days, initialStart]);

  const [selectedDay, setSelectedDay] = useState<string | null>(restored ?? freeDays[0] ?? null);
  const [start, setStart] = useState<string | null>(restored ? initialStart : null);
  const [step, setStep] = useState<Step>("pick");
  const [checking, setChecking] = useState(false);
  const [returnTo, setReturnTo] = useState<string>(booking.href);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  const slots: readonly SlotVM[] = selectedDay ? (days.get(selectedDay) ?? []) : [];
  const startDate = start ? new Date(start) : null;
  const selectedDate = selectedDay ? dateFromKey(selectedDay) : undefined;
  const lastDay = freeDays.at(-1);
  const timeZone = localTimeZone();
  const sessions = sessionsLabel(booking.sessions);

  const confirm = async () => {
    if (!start) return;
    setChecking(true);
    const signedIn = await ensureAuthStatus();
    setChecking(false);
    if (signedIn) {
      setStep("summary");
      return;
    }
    try {
      window.sessionStorage.setItem(pendingSlotKey(booking.id), start);
    } catch {
      // Storage blocked: the visitor picks the slot again after signing in.
    }
    setReturnTo(`${window.location.pathname}${window.location.search}`);
    setStep("signin");
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby={titleId}
      // `max-w`: the browser's own dialog max-width would cost the calendar cells their touch size on phones.
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(46rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-6 p-3 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="m-0 text-xl font-bold">
              {step === "summary" ? "ملخّص الحجز" : step === "signin" ? "سجّل الدخول لإتمام الحجز" : "اختر موعد الجلسة"}
            </h2>
            <p className="m-0 line-clamp-1 text-sm text-fg-muted">
              {booking.title}
              {booking.expertName ? ` · ${booking.expertName}` : null}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--ghost ma-btn--icon size-10 min-h-10 shrink-0">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {step === "pick" && freeDays.length === 0 ? (
          <div className="flex flex-col items-start gap-3 border border-line p-5">
            <CalendarX aria-hidden="true" className="size-6 text-accent" />
            <p className="m-0 font-bold">لا توجد مواعيد متاحة حالياً</p>
            <p className="m-0 text-sm leading-6 text-fg-muted">
              اكتملت مواعيد الخبير للأسابيع القادمة. احفظ الاستشارة في قائمتك وعد لاحقاً، فالمواعيد تُحدَّث باستمرار.
            </p>
          </div>
        ) : null}

        {step === "pick" && freeDays.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_13.5rem] sm:gap-7">
              <Calendar
                mode="single"
                required
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDay(dayKey(date));
                  setStart(null);
                }}
                defaultMonth={selectedDate}
                // Only months that hold a free day can be reached.
                startMonth={dateFromKey(freeDays[0])}
                endMonth={lastDay ? dateFromKey(lastDay) : undefined}
                disabled={(date) => !freeDaySet.has(dayKey(date))}
                modifiers={{ available: (date) => freeDaySet.has(dayKey(date)) }}
                modifiersClassNames={{
                  // A dot under the number: availability is never shown by colour alone.
                  available:
                    "[&>button]:font-bold [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-current [&>button]:after:content-['']",
                }}
              />

              <div className="flex min-w-0 flex-col gap-3 sm:border-s sm:border-line sm:ps-7">
                <h3 id={timesId} className="m-0 text-sm font-bold">
                  {selectedDate ? formatLongDate(selectedDate) : "اختر يوماً"}
                </h3>
                <ul
                  role="group"
                  aria-labelledby={timesId}
                  className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:max-h-[21rem] sm:grid-cols-1 sm:overflow-y-auto sm:pe-1"
                >
                  {slots.map((slot) => {
                    const selected = slot.start === start;
                    return (
                      <li key={slot.start}>
                        <button
                          type="button"
                          disabled={slot.taken}
                          aria-pressed={selected}
                          onClick={() => setStart(slot.start)}
                          className={cn(
                            "ma-btn ma-btn--sm ma-btn--block tabular-nums",
                            selected ? "ma-btn--secondary" : "ma-btn--outline",
                            slot.taken && "opacity-50",
                          )}
                        >
                          <span className={slot.taken ? "line-through" : undefined}>
                            {formatTimeOfDay(new Date(slot.start))}
                          </span>
                          {slot.taken ? <span className="sr-only">محجوز</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="m-0 text-xs leading-5 text-fg-muted">
                  الأوقات بتوقيتك المحلي
                  {timeZone ? (
                    <>
                      {" "}
                      (<span dir="ltr">{timeZone}</span>)
                    </>
                  ) : null}
                  . الأوقات المشطوبة محجوزة.
                </p>
              </div>
            </div>

            {booking.sessions > 1 ? (
              <p className="m-0 flex items-start gap-2 text-sm leading-6 text-fg-muted">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                تحجز الآن موعد الجلسة الأولى، وتُحدَّد مواعيد بقية الجلسات مع الخبير بعدها.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="m-0 text-sm leading-6">
                {startDate ? (
                  <>
                    <span className="text-fg-muted">الموعد المختار: </span>
                    <strong>
                      {formatLongDate(startDate)}، {formatTimeOfDay(startDate)}
                    </strong>
                  </>
                ) : (
                  <span className="text-fg-muted">اختر يوماً ثم وقتاً للمتابعة.</span>
                )}
              </p>
              <button
                type="button"
                onClick={confirm}
                disabled={!start || checking}
                className="ma-btn ma-btn--primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? "لحظة…" : "تأكيد الموعد"}
              </button>
            </div>
          </>
        ) : null}

        {step === "signin" && startDate ? (
          <div className="flex flex-col gap-5">
            <p className="m-0 leading-7">
              موعدك{" "}
              <strong>
                {formatLongDate(startDate)}، {formatTimeOfDay(startDate)}
              </strong>{" "}
              محفوظ مؤقتاً. سجّل الدخول أو أنشئ حساباً لإتمام الحجز، وسنعيدك إلى هذا الموعد.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={routes.loginThen(returnTo)} variant="primary">
                تسجيل الدخول
              </ButtonLink>
              <ButtonLink href={routes.registerThen(returnTo)} variant="outline">
                إنشاء حساب
              </ButtonLink>
            </div>
            <BackButton onClick={() => setStep("pick")} />
          </div>
        ) : null}

        {step === "summary" && startDate ? (
          <div className="flex flex-col gap-5">
            <dl className="m-0 grid gap-x-6 gap-y-3 border border-line p-5 text-[15px] sm:grid-cols-[auto_minmax(0,1fr)]">
              <SummaryRow term="الاستشارة">{booking.title}</SummaryRow>
              {booking.expertName ? <SummaryRow term="الخبير">{booking.expertName}</SummaryRow> : null}
              <SummaryRow term="اليوم">{formatLongDate(startDate)}</SummaryRow>
              <SummaryRow term="الوقت">{formatTimeOfDay(startDate)}</SummaryRow>
              {booking.sessionLength ? <SummaryRow term="مدة الجلسة">{booking.sessionLength}</SummaryRow> : null}
              {sessions && booking.sessions > 1 ? <SummaryRow term="عدد الجلسات">{sessions}</SummaryRow> : null}
              {booking.price.free || booking.price.current ? (
                <SummaryRow term="السعر">
                  {booking.price.free ? "مجانية" : <span dir="ltr">{booking.price.current}</span>}
                </SummaryRow>
              ) : null}
            </dl>
            <div className="ma-alert ma-alert--info" role="status">
              <Info aria-hidden="true" className="fill-none" />
              <div>
                <p className="ma-alert__title">الدفع وتأكيد الحجز قريباً</p>
                <p className="ma-alert__text">
                  نعمل على إتاحة الدفع الإلكتروني للاستشارات. لم يُحجز هذا الموعد بعد، ولن يُخصم أي مبلغ.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackButton onClick={() => setStep("pick")} label="تغيير الموعد" />
              <button type="button" onClick={close} className="ma-btn ma-btn--secondary">
                تم
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

/** Local midnight of a `dayKey`, for the calendar. */
function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function BackButton({ onClick, label = "العودة لاختيار الموعد" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="ma-btn ma-btn--ghost ma-btn--sm gap-2 self-start">
      {/* Back points to the right in Arabic. */}
      <ArrowRight aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function SummaryRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{term}</dt>
      <dd className="m-0 font-bold">{children}</dd>
    </>
  );
}
