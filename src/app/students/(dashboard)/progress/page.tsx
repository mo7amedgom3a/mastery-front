import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { LearningProgressPage } from "@/features/student-dashboard/progress-page";

export const metadata: Metadata = { title: "تقدّم التعلّم" };

export default function Page() {
  return (
    <section aria-labelledby="student-progress-title">
      <StudentPageHeader
        id="student-progress-title"
        title="تقدّم التعلّم"
        lead="تقدّمك في برامجك ونتائج اختباراتك وملخّص حسابك في منصة التعلّم."
      />
      <LearningProgressPage />
    </section>
  );
}
