import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { AccessPage } from "@/features/orders/access-page";

export const metadata: Metadata = { title: "وصولي" };

export default function Page() {
  return (
    <section aria-labelledby="student-access-title">
      <StudentPageHeader id="student-access-title" title="وصولي" />
      <AccessPage />
    </section>
  );
}
