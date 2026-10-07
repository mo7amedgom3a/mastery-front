"use client";

import { CircleX } from "lucide-react";
import { useEffect } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { trackCheckout } from "@/lib/observability/behavior";

import { settleCheckout } from "./model/checkout-session";

/**
 * Back from Stripe without paying.
 * - `cancelled`: the buyer left the payment page. Nothing was charged; the order and its Stripe
 *   session stay open, so paying again from the cart resumes the same session (same idempotency key).
 * - `failed`: the payment was refused; the next attempt starts a new order.
 */
export function CheckoutEndedPage({ outcome, orderId }: { outcome: "cancelled" | "failed"; orderId?: string }) {
  useEffect(() => {
    if (!orderId) return;
    if (outcome === "failed") settleCheckout(orderId);
    trackCheckout("payment_settled", { order_id: orderId, status: outcome });
  }, [orderId, outcome]);

  return (
    <div className="flex flex-col items-start gap-5 rounded-panel border border-line p-6 md:p-10">
      <CircleX aria-hidden="true" className="size-10 fill-none text-accent" />
      <h2 className="m-0 text-2xl font-bold">لم تكتمل عملية الدفع</h2>
      <p className="m-0 max-w-[56ch] leading-7 text-fg-muted">
        {outcome === "cancelled"
          ? "لم يُخصم أي مبلغ، وسلتك محفوظة كما هي. يمكنك إتمام الدفع متى شئت."
          : "رُفضت عملية الدفع ولم يُخصم أي مبلغ. تحقّق من بيانات البطاقة أو جرّب بطاقة أخرى."}
      </p>
      <ul className="ma-cluster m-0 list-none p-0">
        <li>
          <ButtonLink href={routes.cart} variant="primary">
            العودة إلى السلة
          </ButtonLink>
        </li>
        <li>
          <ButtonLink href={routes.search} variant="soft">
            متابعة التسوّق
          </ButtonLink>
        </li>
      </ul>
    </div>
  );
}
