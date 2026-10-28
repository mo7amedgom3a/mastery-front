import type { Metadata } from "next";

import { CertificatesPage } from "@/features/certificates/certificates-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "شهاداتي" };

export default function Page() {
  return (
    <section aria-labelledby="student-certificates-title">
      <StudentPageHeader
        id="student-certificates-title"
        title="شهاداتي"
        lead="شهادات إتمام دوراتك ودبلوماتك: حمّلها بصيغة PDF، وأضفها إلى LinkedIn، وشارك رابط التحقق مع أي جهة."
      />
      <CertificatesPage />
    </section>
  );
}
