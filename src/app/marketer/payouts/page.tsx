import type { Metadata } from "next";

import { MarketerPayoutsPage } from "@/features/marketer-dashboard/payouts-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الرصيد والصرف" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-payouts-title">
      <StudentPageHeader id="marketer-payouts-title" title="الرصيد والصرف" lead="رصيدك المتاح، طلبات الصرف وبيانات الدفع." />
      <MarketerPayoutsPage />
    </section>
  );
}
