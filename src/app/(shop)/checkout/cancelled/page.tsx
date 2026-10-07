import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { CheckoutEndedPage } from "@/features/checkout/checkout-ended-page";

export const metadata: Metadata = {
  title: "أُلغي الدفع",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: PageProps<"/checkout/cancelled">) {
  const orderId = (await searchParams).order_id;
  return (
    <>
      <ShopPageHeader id="checkout-cancelled-title" title="أُلغي الدفع" />
      <section aria-labelledby="checkout-cancelled-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <CheckoutEndedPage outcome="cancelled" orderId={Array.isArray(orderId) ? orderId[0] : orderId} />
        </div>
      </section>
    </>
  );
}
