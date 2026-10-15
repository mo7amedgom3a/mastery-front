import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { CheckoutEndedPage } from "@/features/checkout/checkout-ended-page";

export const metadata: Metadata = {
  title: "لم يكتمل الدفع",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: PageProps<"/checkout/failed">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return (
    <>
      <ShopPageHeader id="checkout-failed-title" title="لم يكتمل الدفع" />
      <section aria-labelledby="checkout-failed-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <CheckoutEndedPage
            outcome="failed"
            orderId={first(params.order_id)}
            paymentIntentId={first(params.payment_intent_id)}
          />
        </div>
      </section>
    </>
  );
}
