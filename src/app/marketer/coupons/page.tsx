import type { Metadata } from "next";

import { MarketerCouponsPage } from "@/features/marketer-dashboard/coupons-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الكوبونات" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-coupons-title">
      <StudentPageHeader id="marketer-coupons-title" title="الكوبونات" lead="الكوبونات المخصصة لك، شاركها وتابع استخدامها." />
      <MarketerCouponsPage />
    </section>
  );
}
