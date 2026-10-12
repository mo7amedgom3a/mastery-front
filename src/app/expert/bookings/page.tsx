import type { Metadata } from "next";

import { ExpertBookingsPage } from "@/features/expert-dashboard/bookings-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الحجوزات" };

export default function Page() {
  return (
    <section aria-labelledby="expert-bookings-title">
      <StudentPageHeader id="expert-bookings-title" title="الحجوزات" lead="كل الحجوزات المدفوعة مع العملاء، مع البحث بالحالة والاستشارة والتاريخ." />
      <ExpertBookingsPage />
    </section>
  );
}
