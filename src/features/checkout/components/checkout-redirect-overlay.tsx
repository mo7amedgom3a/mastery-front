"use client";

import { Lock } from "lucide-react";

import type { CheckoutPhase } from "../api/use-start-checkout";

/**
 * Covers the page while the order and the Stripe session are being created, and until the browser
 * has left for Stripe: nothing else can be pressed meanwhile, and the visitor sees why they wait.
 */
export function CheckoutRedirectOverlay({ phase }: { phase: CheckoutPhase }) {
  if (phase === "idle") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4"
    >
      <div className="flex w-[min(24rem,100%)] flex-col items-center gap-4 rounded-panel bg-surface p-8 text-center">
        <span aria-hidden="true" className="is-loading ma-btn ma-btn--primary ma-btn--icon size-14 rounded-full">
          <Lock className="size-6 fill-none" />
        </span>
        <p className="m-0 text-lg font-bold">
          {phase === "redirecting" ? "جارٍ تحويلك إلى صفحة الدفع الآمنة…" : "جارٍ تجهيز طلبك…"}
        </p>
        <p className="m-0 text-sm leading-6 text-fg-muted">لا تغلق الصفحة ولا تضغط زر الرجوع.</p>
      </div>
    </div>
  );
}
