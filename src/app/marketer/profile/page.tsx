import type { Metadata } from "next";

import { MarketerProfilePage } from "@/features/marketer-dashboard/profile-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "بياناتي" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-profile-title">
      <StudentPageHeader id="marketer-profile-title" title="بياناتي" lead="معلومات حسابك وبيانات التواصل." />
      <MarketerProfilePage />
    </section>
  );
}
