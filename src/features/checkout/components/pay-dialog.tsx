"use client";

import { Lock, ShieldCheck, X } from "lucide-react";
import { QueryClientContext } from "@tanstack/react-query";
import { useContext, useEffect, useId, useRef } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { Money } from "@/components/shop/money";
import { PaymentMethodPicker } from "@/features/cart/components/payment-method-picker";
import { TamaraWidget } from "@/features/cart/components/tamara-widget";
import { usePaymentChoice } from "@/features/cart/components/use-payment-choice";
import { CHECKOUT_CURRENCY } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";
import type { ShopItem } from "@/lib/shop/store";

import type { useStartCheckout } from "../api/use-start-checkout";
import { CheckoutRedirectOverlay } from "./checkout-redirect-overlay";

export type PayDialogProps = {
  item: ShopItem;
  checkout: ReturnType<typeof useStartCheckout>;
  onClose: () => void;
};

/**
 * "Buy now": choose how to pay for one product (card via Stripe, or Tamara in the UAE), then pay.
 * Product pages are static and don't mount React Query; the dialog brings its own client there.
 */
export default function PayDialogWithQueries(props: PayDialogProps) {
  const client = useContext(QueryClientContext);
  return client ? (
    <PayDialog {...props} />
  ) : (
    <QueryProvider>
      <PayDialog {...props} />
    </QueryProvider>
  );
}

function PayDialog({ item, checkout, onClose }: PayDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const price = item.priceAmount;
  const payment = usePaymentChoice(price !== null ? { amount: price, currency: CHECKOUT_CURRENCY } : undefined);
  const tamara = payment.payment.provider === "tamara";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Nothing closes the dialog while the order is being prepared: the redirect follows.
  const close = () => {
    if (!checkout.busy) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(30rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="m-0 text-2xl leading-9 font-bold">
            اختر طريقة الدفع
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={checkout.busy}
            aria-label="إغلاق"
            className="ma-btn ma-btn--bare ma-btn--icon size-11 shrink-0"
          >
            <X aria-hidden="true" className="size-5 fill-none" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-line-strong pb-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="m-0 min-w-0 font-bold">{item.title}</p>
            {price !== null ? <Money amount={price} className="shrink-0 text-xl font-bold" /> : null}
          </div>
          {/* Guidelines §2.1: Tamara's product widget directly below the price. */}
          {payment.widgetOptions ? <TamaraWidget options={payment.widgetOptions} placement="cart" /> : null}
        </div>

        <PaymentMethodPicker
          method={payment.method}
          onMethodChange={(method) => {
            checkout.clearError();
            payment.setMethod(method);
          }}
          tamara={payment.tamara}
          phone={payment.phone}
          onPhoneChange={payment.setPhone}
          phoneError={payment.phoneError}
          disabled={checkout.busy}
        />

        <div className="flex flex-col gap-3">
          {checkout.error ? (
            <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
              {checkout.error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void checkout.start({ mode: "product", item, payment: payment.payment })}
            disabled={checkout.busy || payment.incomplete || price === null}
            aria-busy={checkout.busy}
            className={cn("ma-btn ma-btn--primary ma-btn--lg ma-btn--block gap-2", checkout.busy && "is-loading")}
          >
            <Lock aria-hidden="true" className="size-5 fill-none" />
            {checkout.busy ? "جارٍ تجهيز الدفع…" : tamara ? "ادفع بالتقسيط مع تمارا" : "ادفع بالبطاقة"}
            {!checkout.busy && !tamara && price !== null ? (
              <>
                {" · "}
                <Money amount={price} />
              </>
            ) : null}
          </button>
          <p className="m-0 flex items-start gap-2 text-sm leading-6 text-fg-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-none" />
            {tamara
              ? "ستنتقل إلى صفحة تمارا الآمنة لاختيار خطتك وإتمام الدفع بالدرهم الإماراتي."
              : "تتم عملية الدفع في صفحة Stripe الآمنة. لا نحفظ بيانات بطاقتك."}
          </p>
        </div>
      </div>
      {/* Inside the dialog: a modal dialog sits above everything else on the page. */}
      <CheckoutRedirectOverlay phase={checkout.phase} />
    </dialog>
  );
}
