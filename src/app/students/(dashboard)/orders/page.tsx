import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { OrdersPage } from "@/features/orders/orders-page";

export const metadata: Metadata = { title: "طلباتي" };

export default function Page() {
  return (
    <section aria-labelledby="student-orders-title">
      <StudentPageHeader id="student-orders-title" title="طلباتي" />
      <OrdersPage />
    </section>
  );
}
