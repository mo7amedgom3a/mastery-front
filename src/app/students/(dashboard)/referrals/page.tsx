import type { Metadata } from "next";

import { ReferralsPage } from "@/features/referrals/referrals-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "ادعُ صديقًا" };

export default function Page() {
  return (
    <section aria-labelledby="student-referrals-title">
      <StudentPageHeader id="student-referrals-title" title="ادعُ صديقًا" />
      <ReferralsPage />
    </section>
  );
}
