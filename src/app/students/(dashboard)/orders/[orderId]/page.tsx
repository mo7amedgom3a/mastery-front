import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { OrderDetailPage } from "@/features/orders/order-detail-page";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

export default async function Page({ params }: PageProps<"/students/orders/[orderId]">) {
  const { orderId } = await params;
  return (
    <section aria-labelledby="student-order-title">
      <StudentPageHeader id="student-order-title" title="تفاصيل الطلب" />
      <OrderDetailPage orderId={orderId} />
    </section>
  );
}
