import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { ExamsPage } from "@/features/student-dashboard/exams-page";

export const metadata: Metadata = { title: "اختباراتي" };

export default function Page() {
  return (
    <section aria-labelledby="student-exams-title">
      <StudentPageHeader
        id="student-exams-title"
        title="اختباراتي"
        lead="نتائج اختباراتك المسجّلة في منصة التعلّم: الدرجة والحالة، مع روابط سريعة إلى برامجك."
      />
      <ExamsPage />
    </section>
  );
}
