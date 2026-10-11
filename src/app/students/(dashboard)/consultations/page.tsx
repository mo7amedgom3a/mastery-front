import type { Metadata } from "next";

import { ConsultationsPage } from "@/features/consultations/consultations-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "استشاراتي" };

export default function Page() {
  return (
    <section aria-labelledby="student-consultations-title">
      <StudentPageHeader
        id="student-consultations-title"
        title="استشاراتي"
        lead="مواعيدك مع الخبراء، والدخول إلى الجلسة عند موعدها، وتسجيلات الجلسات السابقة."
      />
      <ConsultationsPage />
    </section>
  );
}
