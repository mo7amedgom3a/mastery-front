import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { OrdersPage } from "@/features/orders/orders-page";

export const metadata: Metadata = { title: "طلباتي" };

export default function Page() {
  return (
    <>
      <ShopPageHeader id="student-orders-title" title="طلباتي" />
      <section aria-labelledby="student-orders-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <OrdersPage />
        </div>
      </section>
    </>
  );
}
