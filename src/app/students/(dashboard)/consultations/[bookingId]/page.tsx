import type { Metadata } from "next";

import { ConsultationPage } from "@/features/consultations/consultation-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "تفاصيل الاستشارة" };

export default async function Page({ params }: PageProps<"/students/consultations/[bookingId]">) {
  const { bookingId } = await params;
  return (
    <section aria-labelledby="student-consultation-title">
      <StudentPageHeader id="student-consultation-title" title="تفاصيل الاستشارة" />
      <ConsultationPage bookingId={bookingId} />
    </section>
  );
}
