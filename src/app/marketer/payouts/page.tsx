import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketerPayoutsPage } from "@/features/marketer-dashboard/payouts-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الأرباح والتحويلات" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-payouts-title">
      <StudentPageHeader
        id="marketer-payouts-title"
        title="الأرباح والتحويلات"
        lead="رصيدك، حساب الاستلام على Stripe، وكل تحويل وصلك."
      />
      <Suspense>
        <MarketerPayoutsPage />
      </Suspense>
    </section>
  );
}
