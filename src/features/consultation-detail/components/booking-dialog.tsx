"use client";

import { clsx as cn } from "clsx";
import { ArrowRight, CalendarX, Info, Minus, Plus, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import {
  CONSULTATION_TERMS_VERSION,
  createBookingCheckout,
  getAvailability,
  type AvailabilityResponse,
} from "@/lib/api/consultations";
import { formatLongDate, formatMoney, formatTimeOfDay } from "@/lib/format";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

import {
  consecutiveRun,
  dayKey,
  findSlotByStart,
  groupSlotsByDay,
  maxRunLength,
  pendingSlotKey,
} from "../model/availability";
import type { BookingVM, SlotVM } from "../model/types";

type Step = "pick" | "signin" | "summary";

type BookingDialogProps = {
  booking: BookingVM;
  /** Slot to reopen on (ISO start), e.g. after the visitor signed in. */
  initialStart: string | null;
  onClose: () => void;
};

type AvailabilityState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: AvailabilityResponse };

function localTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function newBookingKey(): string {
  return `consultation-${crypto.randomUUID()}`;
}

function errorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.detail;
  return typeof detail === "object" && detail !== null && "code" in detail && typeof detail.code === "string"
    ? detail.code
    : null;
}

function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return errorCode(error) === "checkout_in_progress"
        ? "ما زلنا نجهّز صفحة الدفع. حاول مجدداً بعد لحظات."
        : "لم يعد هذا الموعد متاحاً. اختر موعداً آخر.";
    }
    if (error.status === 404) return "هذه الاستشارة غير متاحة للحجز حالياً.";
    if (error.status === 422) return "تعذّر حجز هذا الموعد. حدّث الصفحة واختر الموعد مجدداً.";
    if (error.status === 429) return "محاولات كثيرة في وقت قصير. انتظر قليلاً ثم حاول مجدداً.";
    if (error.status >= 500) return "الحجز غير متاح حالياً. حاول مجدداً بعد قليل.";
  }
  return "تعذّر بدء الدفع. تحقّق من اتصالك وحاول مجدداً.";
}

/**
 * Booking flow in a modal: pick a day, a start time and how many back-to-back sessions, accept the
 * terms, then pay on Stripe. Guests are asked to sign in first. The slots are held for the visitor
 * while they pay; the expert confirms the booking afterwards.
 */
export default function BookingDialog({ booking, initialStart, onClose }: BookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const timesId = useId();
  const termsId = useId();
  const [availability, setAvailability] = useState<AvailabilityState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getAvailability(booking.productRef, undefined, { signal: controller.signal })
      .then((data) => setAvailability({ status: "ready", data }))
      .catch(() => {
        if (!controller.signal.aborted) setAvailability({ status: "error" });
      });
    return () => controller.abort();
  }, [booking.productRef]);

  const days = useMemo(
    () => (availability.status === "ready" ? groupSlotsByDay(availability.data.slots) : new Map<string, SlotVM[]>()),
    [availability],
  );
  const freeDays = useMemo(() => [...days.keys()], [days]);
  const freeDaySet = useMemo(() => new Set(freeDays), [freeDays]);
  const maxSlots = availability.status === "ready" ? availability.data.max_slots : 1;

  const restored = initialStart ? findSlotByStart(days, initialStart) : null;

  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [step, setStep] = useState<Step>("pick");
  const [checking, setChecking] = useState(false);
  const [returnTo, setReturnTo] = useState<string>(booking.href);
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // One key per selection, so a retry (double click, flaky network) reuses the same booking.
  const keys = useRef(new Map<string, string>());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  const selectedDay = pickedDay ?? restored?.key ?? freeDays[0] ?? null;
  const slotId = pickedSlot ?? (pickedDay ? null : (restored?.id ?? null));
  const slots: readonly SlotVM[] = selectedDay ? (days.get(selectedDay) ?? []) : [];
  const longest = slotId ? maxRunLength(slots, slotId, maxSlots) : 1;
  const count = Math.min(hours, longest);
  const run = slotId ? consecutiveRun(slots, slotId, count) : null;
  const startDate = run ? new Date(run[0].start) : null;
  const endDate = run ? new Date(run.at(-1)!.end) : null;
  const selectedDate = selectedDay ? dateFromKey(selectedDay) : undefined;
  const lastDay = freeDays.at(-1);
  const timeZone = localTimeZone();
  const total = booking.priceAmount ? booking.priceAmount * count : null;

  const confirm = async () => {
    if (!run) return;
    setChecking(true);
    const signedIn = await ensureAuthStatus();
    setChecking(false);
    if (signedIn) {
      setStep("summary");
      return;
    }
    try {
      window.sessionStorage.setItem(pendingSlotKey(booking.id), run[0].start);
    } catch {
      // Storage blocked: the visitor picks the slot again after signing in.
    }
    setReturnTo(`${window.location.pathname}${window.location.search}`);
    setStep("signin");
  };

  const pay = async () => {
    if (!run || !accepted || availability.status !== "ready") return;
    setPaying(true);
    setPayError(null);
    const slotIds = run.map((slot) => slot.id);
    const fingerprint = slotIds.join(",");
    let key = keys.current.get(fingerprint) ?? newBookingKey();
    keys.current.set(fingerprint, key);
    const origin = window.location.origin;
    const body = {
      product_id: availability.data.product_id,
      slot_ids: slotIds,
      terms_accepted: true,
      terms_version: availability.data.terms_version || CONSULTATION_TERMS_VERSION,
      success_url: `${origin}${routes.studentConsultations}`,
      cancel_url: `${origin}${booking.href}`,
    };
    try {
      let result;
      try {
        result = await createBookingCheckout(body, key);
      } catch (error) {
        const code = errorCode(error);
        if (code !== "idempotency_key_reused" && code !== "idempotency_key_expired") throw error;
        key = newBookingKey();
        keys.current.set(fingerprint, key);
        result = await createBookingCheckout(body, key);
      }
      window.location.assign(result.checkout.checkout_url);
    } catch (error) {
      setPaying(false);
      setPayError(bookingErrorMessage(error));
    }
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
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(46rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
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
          <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--bare ma-btn--icon size-10 min-h-10 shrink-0">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {step === "pick" && availability.status === "loading" ? (
          <div role="status" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13.5rem]">
            <span className="sr-only">جارٍ تحميل المواعيد المتاحة…</span>
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : null}

        {step === "pick" && availability.status === "error" ? (
          <div className="ma-alert ma-alert--warning" role="alert">
            <div>
              <p className="ma-alert__title">تعذّر تحميل المواعيد</p>
              <p className="ma-alert__text">تحقّق من اتصالك ثم أعد فتح نافذة الحجز.</p>
            </div>
          </div>
        ) : null}

        {step === "pick" && availability.status === "ready" && freeDays.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-panel border border-line p-5">
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
                  setPickedDay(dayKey(date));
                  setPickedSlot(null);
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
                    const selected = slot.id === slotId;
                    return (
                      <li key={slot.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            if (!pickedDay && selectedDay) setPickedDay(selectedDay);
                            setPickedSlot(slot.id);
                          }}
                          className={cn(
                            "ma-btn ma-btn--sm ma-btn--block tabular-nums",
                            selected ? "ma-btn--secondary" : "ma-btn--soft",
                          )}
                        >
                          {formatTimeOfDay(new Date(slot.start))}
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
                  .
                </p>
              </div>
            </div>

            {slotId ? (
              <div className="flex flex-col gap-2 rounded-panel border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold">عدد الجلسات المتتالية</p>
                  <p className="m-0 text-xs leading-5 text-fg-muted">
                    {longest > 1
                      ? `يمكنك حجز حتى ${longest} جلسات متتالية من هذا الوقت${booking.sessionLength ? `، مدة كل جلسة ${booking.sessionLength}` : ""}.`
                      : "الخبير متاح لجلسة واحدة فقط من هذا الوقت."}
                  </p>
                </div>
                <div className="flex items-center gap-3" role="group" aria-label="عدد الجلسات">
                  <button
                    type="button"
                    onClick={() => setHours(Math.max(1, count - 1))}
                    disabled={count <= 1}
                    aria-label="جلسة أقل"
                    className="ma-btn ma-btn--soft ma-btn--icon size-10 min-h-10 disabled:opacity-50"
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </button>
                  <output aria-live="polite" className="min-w-6 text-center text-lg font-bold tabular-nums">
                    {count}
                  </output>
                  <button
                    type="button"
                    onClick={() => setHours(Math.min(longest, count + 1))}
                    disabled={count >= longest}
                    aria-label="جلسة أكثر"
                    className="ma-btn ma-btn--soft ma-btn--icon size-10 min-h-10 disabled:opacity-50"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="m-0 text-sm leading-6">
                {startDate && endDate ? (
                  <>
                    <span className="text-fg-muted">الموعد المختار: </span>
                    <strong>
                      {formatLongDate(startDate)}، {formatTimeOfDay(startDate)} – {formatTimeOfDay(endDate)}
                    </strong>
                  </>
                ) : (
                  <span className="text-fg-muted">اختر يوماً ثم وقتاً للمتابعة.</span>
                )}
              </p>
              <button
                type="button"
                onClick={confirm}
                disabled={!run || checking}
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
              <ButtonLink href={routes.registerThen(returnTo)} variant="soft">
                إنشاء حساب
              </ButtonLink>
            </div>
            <BackButton onClick={() => setStep("pick")} />
          </div>
        ) : null}

        {step === "summary" && startDate && endDate ? (
          <div className="flex flex-col gap-5">
            <dl className="m-0 grid gap-x-6 gap-y-3 rounded-panel border border-line p-5 text-[15px] sm:grid-cols-[auto_minmax(0,1fr)]">
              <SummaryRow term="الاستشارة">{booking.title}</SummaryRow>
              {booking.expertName ? <SummaryRow term="الخبير">{booking.expertName}</SummaryRow> : null}
              <SummaryRow term="اليوم">{formatLongDate(startDate)}</SummaryRow>
              <SummaryRow term="الوقت">
                {formatTimeOfDay(startDate)} – {formatTimeOfDay(endDate)}
              </SummaryRow>
              <SummaryRow term="عدد الجلسات">
                {count}
                {booking.sessionLength ? ` × ${booking.sessionLength}` : null}
              </SummaryRow>
              {total ? (
                <SummaryRow term="الإجمالي">
                  <span dir="ltr">{formatMoney(total)}</span>
                </SummaryRow>
              ) : null}
            </dl>

            <div className="flex flex-col gap-3 rounded-panel border border-line p-5 text-sm leading-6">
              <p className="m-0 font-bold">شروط الاستشارة</p>
              <ul className="m-0 flex list-disc flex-col gap-1 ps-5 text-fg-muted">
                <li>يؤكّد الخبير الموعد بعد الدفع. إن لم يؤكّده يُردّ المبلغ كاملاً.</li>
                <li>تُسجَّل الجلسة صوتاً وصورة للرجوع إليها لاحقاً، ويمكنك مشاهدة التسجيل من حسابك.</li>
                <li>يُتاح الدخول إلى الجلسة قبل موعدها بخمس دقائق، وتنتهي تلقائياً عند انتهاء المدة المحجوزة.</li>
                <li>يُردّ المبلغ إذا لم يحضر الخبير الجلسة فقط، ولا يُردّ عند غياب العميل.</li>
              </ul>
              <label htmlFor={termsId} className="flex cursor-pointer items-start gap-3 pt-1 font-bold">
                <input
                  id={termsId}
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-current"
                />
                قرأت الشروط وأوافق عليها، بما في ذلك تسجيل الجلسة.
              </label>
            </div>

            {payError ? (
              <div className="ma-alert ma-alert--warning" role="alert">
                <Info aria-hidden="true" className="fill-none" />
                <div>
                  <p className="ma-alert__text">{payError}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackButton onClick={() => setStep("pick")} label="تغيير الموعد" />
              <button
                type="button"
                onClick={pay}
                disabled={!accepted || paying}
                className="ma-btn ma-btn--primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paying ? "جارٍ تجهيز الدفع…" : "المتابعة إلى الدفع"}
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
