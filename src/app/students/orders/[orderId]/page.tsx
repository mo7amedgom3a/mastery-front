import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { OrderDetailPage } from "@/features/orders/order-detail-page";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

export default async function Page({ params }: PageProps<"/students/orders/[orderId]">) {
  const { orderId } = await params;
  return (
    <>
      <ShopPageHeader id="student-order-title" title="تفاصيل الطلب" />
      <section aria-labelledby="student-order-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <OrderDetailPage orderId={orderId} />
        </div>
      </section>
    </>
  );
}
