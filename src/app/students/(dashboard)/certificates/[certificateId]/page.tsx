import type { Metadata } from "next";

import { CertificateDetailPage } from "@/features/certificates/certificate-detail-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "شهادتي" };

export default async function Page({ params }: PageProps<"/students/certificates/[certificateId]">) {
  const { certificateId } = await params;
  return (
    <section aria-labelledby="student-certificate-title">
      <StudentPageHeader id="student-certificate-title" title="شهادة الإتمام" />
      <CertificateDetailPage certificateId={certificateId} />
    </section>
  );
}
