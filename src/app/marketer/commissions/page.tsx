import type { Metadata } from "next";

import { MarketerCommissionsPage } from "@/features/marketer-dashboard/commissions-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "العمولات" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-commissions-title">
      <StudentPageHeader id="marketer-commissions-title" title="العمولات" lead="كل عمولة احتسبها Tolt وحالتها." />
      <MarketerCommissionsPage />
    </section>
  );
}
