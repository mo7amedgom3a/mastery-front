import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { OrderResultPage } from "@/features/checkout/order-result-page";

export const metadata: Metadata = {
  title: "لم يكتمل الدفع",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <ShopPageHeader id="checkout-failed-title" title="لم يكتمل الدفع" />
      <section aria-labelledby="checkout-failed-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <OrderResultPage outcome="failed" />
        </div>
      </section>
    </>
  );
}
