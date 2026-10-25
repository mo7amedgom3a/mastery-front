import type { Metadata } from "next";

import { MarketerOverviewPage } from "@/features/marketer-dashboard/overview-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "نظرة عامة" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-overview-title">
      <StudentPageHeader id="marketer-overview-title" title="نظرة عامة" lead="أداء رابطك وكوبوناتك: العملاء والمبيعات والعمولات ورصيدك." />
      <MarketerOverviewPage />
    </section>
  );
}
