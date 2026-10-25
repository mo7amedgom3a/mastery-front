import type { Metadata } from "next";

import { MarketerCustomersPage } from "@/features/marketer-dashboard/customers-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "العملاء" };

export default function Page() {
  return (
    <section aria-labelledby="marketer-customers-title">
      <StudentPageHeader id="marketer-customers-title" title="العملاء" lead="من سجّل أو اشترى عبر رابطك أو كوبونك." />
      <MarketerCustomersPage />
    </section>
  );
}
