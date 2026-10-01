"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/button";
import { isMockCheckoutEnabled } from "@/config/env";
import { routes } from "@/config/routes";
import { useShopStore } from "@/lib/shop/store";

type AuthGateDialogProps = {
  /** MOCK: the visitor chose to go on as the test customer. */
  onMockContinue: () => void;
};

/**
 * Shown when a guest presses pay: an order belongs to an account, so they sign in or register
 * first. The cart is kept in the browser, and the auth pages send them back to it. Mock checkout
 * also offers a test customer, to try the payment steps without an account.
 */
export function AuthGateDialog({ onMockContinue }: AuthGateDialogProps) {
  const open = useShopStore((state) => state.authGateOpen);
  const close = useShopStore((state) => state.closeAuthGate);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mock = isMockCheckoutEnabled();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="auth-gate-title"
      className="m-auto max-h-[calc(100svh-1rem)] w-[min(30rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-y-auto border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="auth-gate-title" className="m-0 text-2xl leading-9 font-bold">
            سجّل الدخول لإتمام الدفع
          </h2>
          <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--ghost ma-btn--icon size-11 shrink-0">
            <X aria-hidden="true" className="size-5 fill-none" />
          </button>
        </div>
        <p className="m-0 leading-7 text-fg-muted">
          نربط مشترياتك بحسابك لتجدها في أي وقت ومن أي جهاز. سلتك محفوظة كما هي، وستعود إليها مباشرةً بعد تسجيل الدخول
          أو إنشاء الحساب.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ButtonLink href={routes.loginThen(routes.cart)} variant="primary">
            تسجيل الدخول
          </ButtonLink>
          <ButtonLink href={routes.registerThen(routes.cart)} variant="outline">
            إنشاء حساب
          </ButtonLink>
        </div>

        {mock ? (
          <div className="flex flex-col items-start gap-3 border-t border-line pt-5">
            <span className="ma-tag ma-tag--yellow">وضع تجريبي</span>
            <p className="m-0 text-sm leading-6 text-fg-muted">
              لتجربة خطوات الدفع دون حساب، تابع كعميل تجريبي: لن يُنشأ حساب ولن يُخصم أي مبلغ.
            </p>
            <button type="button" onClick={onMockContinue} className="ma-btn ma-btn--secondary ma-btn--block">
              متابعة كعميل تجريبي
            </button>
          </div>
        ) : null}

        <button type="button" onClick={close} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 self-center">
          متابعة التسوّق
        </button>
      </div>
    </dialog>
  );
}
