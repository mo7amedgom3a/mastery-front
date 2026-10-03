"use client";

import { FlaskConical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { confirmMockPayment, ShopApiError } from "@/features/cart/api/shop-client";
import { findPaymentMethod } from "@/features/cart/model/payment-methods";
import { trackCheckout } from "@/lib/observability/behavior";
import { useShopHydrated, useShopStore } from "@/lib/shop/store";

import { OrderDetails } from "./components/order-details";
import { OrderSkeleton } from "./components/order-skeleton";

const providerName = { stripe: "Stripe", tabby: "Tabby", tamara: "Tamara" } as const;

/**
 * MOCK: stands where a payment provider's hosted page will be (Stripe Checkout, Tabby, Tamara). The
 * tester picks the outcome; the order's status is updated and they land on the matching result
 * page, exactly as a provider redirects back after a real payment.
 * TODO(api): delete with the mock; the order endpoint will return the provider's own URL.
 */
export function MockGatewayPage() {
  const router = useRouter();
  const orderId = useSearchParams().get("order");
  const hydrated = useShopHydrated();
  const order = useShopStore((state) => state.order);
  const [busy, setBusy] = useState<"success" | "failure" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <OrderSkeleton />;
  }

  if (!order || order.orderId !== orderId || order.status === "paid") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
        <h2 className="m-0 text-2xl leading-10 font-bold">لا يوجد طلب بانتظار الدفع</h2>
        <p className="m-0 max-w-[52ch] text-fg-muted">ربما اكتمل هذا الطلب أو انتهت جلسته. عد إلى سلتك وابدأ الدفع من جديد.</p>
        <ButtonLink href={routes.cart} variant="primary">
          العودة إلى السلة
        </ButtonLink>
      </div>
    );
  }

  const method = findPaymentMethod(order.paymentMethod);

  const settle = async (outcome: "success" | "failure") => {
    setBusy(outcome);
    setError(null);
    try {
      const result = await confirmMockPayment({ orderId: order.orderId, outcome });
      const shop = useShopStore.getState();
      shop.setOrder({ ...order, status: result.status, paidAt: result.paidAt });
      trackCheckout("payment_settled", {
        order_number: order.number,
        outcome,
        status: result.status,
        total: order.totals.total,
      });
      if (result.status === "paid") {
        shop.clearCart();
        router.replace(routes.checkoutSuccess);
      } else {
        // The cart is kept: the customer can try again or pick another method.
        router.replace(routes.checkoutFailed);
      }
    } catch (cause) {
      setError(cause instanceof ShopApiError ? cause.message : "تعذّر الاتصال. حاول مجدداً.");
      setBusy(null);
    }
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
      <div className="flex min-w-0 flex-col gap-5 rounded-panel border border-line-strong bg-surface p-5 sm:p-8">
        <div className="flex items-start gap-3">
          <FlaskConical aria-hidden="true" className="mt-1 size-6 shrink-0 text-accent" />
          <div className="flex flex-col gap-2">
            <span className="ma-tag ma-tag--yellow self-start">وضع تجريبي</span>
            <h2 className="m-0 text-2xl leading-9 font-bold">
              محاكاة صفحة الدفع{method ? ` — ${method.label}` : ""}
            </h2>
          </div>
        </div>
        <p className="m-0 leading-7 text-fg-muted">
          هنا ستظهر صفحة مزوّد الدفع
          {method ? (
            <>
              {" "}
              (<span dir="ltr">{providerName[method.provider]}</span>)
            </>
          ) : null}{" "}
          عند ربط بوابات الدفع. لا تُدخَل أي بيانات بطاقة ولا يُخصم أي مبلغ: اختر النتيجة التي تريد تجربتها.
        </p>
        <p className="m-0 flex items-baseline gap-3 border-y border-line py-4">
          <span className="text-fg-muted">المبلغ المطلوب</span>
          <Money amount={order.totals.total} className="text-3xl font-bold" />
        </p>
        {error ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void settle("success")}
            disabled={busy !== null}
            aria-busy={busy === "success"}
            className={`ma-btn ma-btn--primary ${busy === "success" ? "is-loading" : ""}`}
          >
            محاكاة دفع ناجح
          </button>
          <button
            type="button"
            onClick={() => void settle("failure")}
            disabled={busy !== null}
            aria-busy={busy === "failure"}
            className={`ma-btn ma-btn--soft ${busy === "failure" ? "is-loading" : ""}`}
          >
            محاكاة فشل الدفع
          </button>
          <ButtonLink href={routes.cart} variant="ghost">
            إلغاء والعودة إلى السلة
          </ButtonLink>
        </div>
      </div>

      <OrderDetails order={order} linked={false} />
    </div>
  );
}
