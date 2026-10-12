import type { Metadata } from "next";

import { ExpertCalendarPage } from "@/features/expert-dashboard/components/expert-calendar";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "التقويم" };

export default function Page() {
  return (
    <section aria-labelledby="expert-calendar-title">
      <StudentPageHeader id="expert-calendar-title" title="التقويم" lead="افتح مواعيدك المتاحة، وعدّلها أو احذفها، وأدر الحجوزات من يوم بيومه." />
      <ExpertCalendarPage />
    </section>
  );
}
