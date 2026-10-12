import type { Metadata } from "next";

import { ExpertSettingsPage } from "@/features/expert-dashboard/settings-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الإعدادات" };

export default function Page() {
  return (
    <section aria-labelledby="expert-settings-title">
      <StudentPageHeader id="expert-settings-title" title="الإعدادات" lead="اسمك الظاهر للعملاء ونبذتك ومدة الجلسة." />
      <ExpertSettingsPage />
    </section>
  );
}
