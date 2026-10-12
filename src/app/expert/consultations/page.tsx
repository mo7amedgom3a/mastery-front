import type { Metadata } from "next";

import { ExpertServicesPage } from "@/features/expert-dashboard/services-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "استشاراتي المعروضة" };

export default function Page() {
  return (
    <section aria-labelledby="expert-services-title">
      <StudentPageHeader id="expert-services-title" title="استشاراتي المعروضة" lead="الاستشارات التي يحجزها العملاء من مواعيدك: العنوان والوصف والسعر." />
      <ExpertServicesPage />
    </section>
  );
}
