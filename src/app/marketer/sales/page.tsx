import type { Metadata } from "next";

import { MarketerSalesPage } from "@/features/marketer-dashboard/sales-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "المبيعات" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-sales-title">
      <StudentPageHeader id="marketer-sales-title" title="المبيعات" lead="الطلبات المنسوبة إليك وعمولة كل طلب." />
      <MarketerSalesPage />
    </section>
  );
}
