"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Lock, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Money } from "@/components/shop/money";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import { commerceQueries, startExtensionCheckout, type ExtensionOptionResponse } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";

const DAY_FORMS = { one: "يوم واحد", two: "يومان", few: "أيام", many: "يوماً" };

function optionLabel(option: ExtensionOptionResponse): string {
  if (option.lifetime) return "وصول مدى الحياة";
  return option.extended_days ? `تمديد ${formatCount(option.extended_days, DAY_FORMS)}` : option.label;
}

/**
 * Buy more access time for one program: lists the extension options the backend offers for this
 * entitlement and opens Stripe Checkout for the chosen one. After payment the student lands back on
 * the access page (`?extended=1`) with the new expiry.
 */
export function ExtendAccessDialog({ entitlementId, title, onClose }: { entitlementId: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const options = useQuery(commerceQueries.extensionOptions(entitlementId));
  const eligible = (options.data ?? []).filter((option) => option.eligible);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per dialog: a double click or a retry opens the same checkout session.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const choice = picked ?? eligible[0]?.code ?? null;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (!busy) onClose();
  };

  const pay = async () => {
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const session = await startExtensionCheckout(
        {
          entitlement_id: entitlementId,
          option_code: choice,
          success_url: `${origin}${routes.studentAccess}?extended=1`,
          cancel_url: `${origin}${routes.studentAccess}`,
        },
        idempotencyKey,
      );
      window.location.assign(session.checkout_url);
    } catch (cause) {
      setBusy(false);
      if (cause instanceof ApiError && cause.status === 401) {
        window.location.assign(routes.loginThen(window.location.pathname));
        return;
      }
      setError(cause instanceof ApiError && cause.status === 409 ? "لا يمكن تمديد هذا الوصول الآن." : "تعذّر بدء الدفع. حاول مرة أخرى.");
    }
  };

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
              تمديد الوصول
            </h2>
            <p className="m-0 text-fg-muted">{title}</p>
          </div>
          <button type="button" onClick={close} disabled={busy} aria-label="إغلاق" className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0">
            <X aria-hidden="true" className="size-5 fill-none" />
          </button>
        </div>

        {options.isPending ? (
          <p role="status" className="m-0 text-fg-muted">
            جارٍ تحميل خيارات التمديد…
          </p>
        ) : options.isError ? (
          <p role="alert" className="m-0">
            تعذّر تحميل خيارات التمديد.
          </p>
        ) : eligible.length === 0 ? (
          <p className="m-0 text-fg-muted">
            {options.data?.[0]?.reason ? "التمديد غير متاح لهذا البرنامج حالياً." : "لا توجد خيارات تمديد لهذا البرنامج."}
          </p>
        ) : (
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="sr-only">اختر مدة التمديد</legend>
            {eligible.map((option) => (
              <label
                key={option.code}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-panel border p-4",
                  choice === option.code ? "border-accent" : "border-line",
                )}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="extension-option" checked={choice === option.code} onChange={() => setPicked(option.code)} disabled={busy} />
                  <CalendarPlus aria-hidden="true" className="size-5 fill-none text-accent" />
                  <span className="font-bold">{optionLabel(option)}</span>
                </span>
                {option.amount_minor != null ? (
                  <Money amount={option.amount_minor / 100} currency={option.currency_code ?? undefined} className="font-bold" />
                ) : null}
              </label>
            ))}
          </fieldset>
        )}

        {error ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void pay()}
          disabled={!choice || busy}
          aria-busy={busy}
          className={cn("ma-btn ma-btn--primary ma-btn--lg ma-btn--block gap-2", busy && "is-loading")}
        >
          <Lock aria-hidden="true" className="size-5 fill-none" />
          {busy ? "جارٍ تجهيز الدفع…" : "ادفع بالبطاقة"}
        </button>
        <p className="m-0 text-sm leading-6 text-fg-muted">تتم عملية الدفع في صفحة Stripe الآمنة، وتُضاف المدة إلى تاريخ انتهاء وصولك بعد الدفع.</p>
      </div>
    </dialog>
  );
}
