import type { Metadata } from "next";

import { ExpertOverviewPage } from "@/features/expert-dashboard/overview-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "نظرة عامة" };

export default function Page() {
  return (
    <section aria-labelledby="expert-overview-title">
      <StudentPageHeader id="expert-overview-title" title="نظرة عامة" lead="طلبات الحجز الجديدة وجلستك القادمة ونشاطك هذا الشهر." />
      <ExpertOverviewPage />
    </section>
  );
}
