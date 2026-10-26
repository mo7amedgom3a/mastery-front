"use client";

import { CalendarClock, X, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { cancelMySubscription, type MySubscription } from "@/lib/api/subscriptions";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

type Mode = "period_end" | "now";

/**
 * Confirm a cancellation: stop renewal (access stays until the period ends and can be resumed
 * until then) or end the subscription now (the plan's programs close immediately).
 */
export function CancelSubscriptionDialog({
  subscription,
  onClose,
  onCanceled,
}: {
  subscription: MySubscription;
  onClose: () => void;
  onCanceled: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Renewal already off: only ending now is left.
  const [mode, setMode] = useState<Mode>(subscription.cancel_at_period_end ? "now" : "period_end");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per dialog: a double click or a retry repeats the same Stripe call.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const endsOn = formatDate(subscription.current_period_end);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (!busy) onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelMySubscription(subscription.subscription_id, {
        immediate: mode === "now",
        idempotencyKey: `${idempotencyKey}-${mode}`,
      });
      onCanceled();
    } catch (cause) {
      setBusy(false);
      if (cause instanceof ApiError && typeof cause.details.detail === "string" && cause.status === 409) {
        setError("حالة الاشتراك تغيّرت. حدّث الصفحة وحاول مجدداً.");
        return;
      }
      setError(cause instanceof ApiError && cause.status === 502 ? "تعذّر الاتصال بمزوّد الدفع. حاول بعد قليل." : "تعذّر إلغاء الاشتراك. حاول مجدداً.");
    }
  };

  const options: { value: Mode; icon: typeof CalendarClock; title: string; text: string }[] = [
    ...(subscription.cancel_at_period_end
      ? []
      : [
          {
            value: "period_end" as const,
            icon: CalendarClock,
            title: "إلغاء التجديد في نهاية الفترة",
            text: `يبقى وصولك حتى ${endsOn} ولن تُخصم أي دفعة جديدة. يمكنك التراجع قبل هذا التاريخ.`,
          },
        ]),
    {
      value: "now",
      icon: XCircle,
      title: "إلغاء الآن",
      text: "ينتهي الاشتراك فوراً وتُغلق برامج الباقة. لا يمكن التراجع عن هذا الخيار.",
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(30rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="m-0 text-2xl leading-9 font-bold">
              إلغاء الاشتراك
            </h2>
            <p className="m-0 text-fg-muted">{subscription.plan_title}</p>
          </div>
          <button type="button" onClick={close} disabled={busy} aria-label="إغلاق" className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0">
            <X aria-hidden="true" className="size-5 fill-none" />
          </button>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="sr-only">طريقة الإلغاء</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-panel border p-4",
                mode === option.value ? "border-accent" : "border-line",
              )}
            >
              <input
                type="radio"
                name="cancel-mode"
                className="mt-1"
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                disabled={busy}
              />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-bold">
                  <option.icon aria-hidden="true" className="size-5 fill-none text-accent" />
                  {option.title}
                </span>
                <span className="text-sm leading-6 text-fg-muted">{option.text}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            aria-busy={busy}
            className={cn("ma-btn ma-btn--primary flex-1", busy && "is-loading")}
          >
            {busy ? "جارٍ الإلغاء…" : mode === "now" ? "إلغاء الاشتراك الآن" : "تأكيد إلغاء التجديد"}
          </button>
          <button type="button" onClick={close} disabled={busy} className="ma-btn ma-btn--soft flex-1">
            الاحتفاظ بالاشتراك
          </button>
        </div>
      </div>
    </dialog>
  );
}
