import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { CheckoutSuccessPage } from "@/features/checkout/checkout-success-page";

export const metadata: Metadata = {
  title: "تأكيد الطلب",
  robots: { index: false, follow: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Stripe's return URL. The backend put `order_id` and `payment_intent_id` on it. */
export default async function Page({ searchParams }: PageProps<"/checkout/success">) {
  const params = await searchParams;
  return (
    <>
      <ShopPageHeader id="checkout-success-title" title="تأكيد الطلب" />
      <section aria-labelledby="checkout-success-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <CheckoutSuccessPage orderId={first(params.order_id)} paymentIntentId={first(params.payment_intent_id)} />
        </div>
      </section>
    </>
  );
}
