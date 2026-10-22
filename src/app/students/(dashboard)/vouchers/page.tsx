import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { VouchersPage } from "@/features/vouchers/vouchers-page";

export const metadata: Metadata = { title: "قسائم الرصيد" };

export default function Page() {
  return (
    <section aria-labelledby="student-vouchers-title">
      <StudentPageHeader id="student-vouchers-title" title="قسائم الرصيد" />
      <VouchersPage />
    </section>
  );
}
