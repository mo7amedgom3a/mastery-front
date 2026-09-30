import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { OrderResultPage } from "@/features/checkout/order-result-page";

export const metadata: Metadata = {
  title: "تأكيد الطلب",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <ShopPageHeader id="checkout-success-title" title="تأكيد الطلب" />
      <section aria-labelledby="checkout-success-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <OrderResultPage outcome="success" />
        </div>
      </section>
    </>
  );
}
