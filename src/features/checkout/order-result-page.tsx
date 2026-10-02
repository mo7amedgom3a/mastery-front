"use client";

import { CircleCheck, CircleX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { isMockCheckoutEnabled } from "@/config/env";
import { routes } from "@/config/routes";
import { useShopHydrated, useShopStore } from "@/lib/shop/store";

import { OrderDetails } from "./components/order-details";
import { OrderSkeleton } from "./components/order-skeleton";

/**
 * Where the customer lands after payment: the confirmation (`success`) or the way back to the cart
 * (`failed`). The order shown is the one this browser just placed.
 * TODO(api): load the order from the backend by id, so the page survives a reload on another device
 * and reflects the provider's webhook rather than the browser's word.
 */
export function OrderResultPage({ outcome }: { outcome: "success" | "failed" }) {
  const hydrated = useShopHydrated();
  const order = useShopStore((state) => state.order);

  if (!hydrated) {
    return <OrderSkeleton />;
  }

  if (outcome === "failed") {
    return (
      <div className="flex max-w-[44rem] flex-col items-start gap-5">
        <div className="ma-alert ma-alert--danger w-full" role="alert">
          <CircleX aria-hidden="true" className="fill-none" />
          <div>
            <p className="ma-alert__title">لم يكتمل الدفع</p>
            <p className="ma-alert__text">
              لم يُخصم أي مبلغ{order?.status === "failed" ? <> للطلب <span dir="ltr">{order.number}</span></> : null}. سلتك كما
              تركتها: جرّب مجدداً أو اختر طريقة دفع أخرى.
            </p>
          </div>
        </div>
        <ul className="ma-cluster m-0 list-none p-0">
          <li>
            <ButtonLink href={routes.cart} variant="primary">
              العودة إلى السلة
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href={routes.search} variant="soft">
              متابعة التصفّح
            </ButtonLink>
          </li>
        </ul>
      </div>
    );
  }

  if (!order || order.status !== "paid") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
        <h2 className="m-0 text-2xl leading-10 font-bold">لا يوجد طلب مكتمل لعرضه</h2>
        <p className="m-0 max-w-[52ch] text-fg-muted">تظهر هذه الصفحة بعد إتمام الدفع. إن كانت في سلتك منتجات، يمكنك إكمال طلبك منها.</p>
        <ButtonLink href={routes.cart} variant="primary">
          افتح السلة
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex max-w-[52rem] flex-col gap-6">
      <div className="ma-alert ma-alert--success" role="status">
        <CircleCheck aria-hidden="true" className="fill-none" />
        <div>
          <p className="ma-alert__title">تم استلام طلبك</p>
          <p className="ma-alert__text">
            {isMockCheckoutEnabled()
              ? "هذا طلب تجريبي: لم يُخصم أي مبلغ ولم تُفعَّل أي برامج."
              : "شكراً لك. ستجد برامجك في حسابك، وأرسلنا التفاصيل إلى بريدك."}
          </p>
        </div>
      </div>
      <OrderDetails order={order} />
      <ul className="ma-cluster m-0 list-none p-0">
        <li>
          <ButtonLink href={routes.search} variant="primary">
            متابعة التصفّح
          </ButtonLink>
        </li>
        <li>
          <ButtonLink href={routes.home} variant="soft">
            الصفحة الرئيسية
          </ButtonLink>
        </li>
      </ul>
    </div>
  );
}
