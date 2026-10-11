import type { Metadata } from "next";

import { ExpertPage } from "@/features/consultations/expert-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "لوحة الخبير" };

export default function Page() {
  return (
    <section aria-labelledby="student-expert-title">
      <StudentPageHeader
        id="student-expert-title"
        title="لوحة الخبير"
        lead="أكّد طلبات الاستشارة الجديدة، وادخل جلساتك القادمة، وحدّد مواعيدك المتاحة."
      />
      <ExpertPage />
    </section>
  );
}
