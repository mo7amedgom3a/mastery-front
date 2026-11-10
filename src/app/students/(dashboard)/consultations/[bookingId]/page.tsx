import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { getConsultationDetail } from "@/features/consultation-detail/api/get-consultation-detail";
import { ConsultationPage } from "@/features/consultations/consultation-page";
import { StudentConsultationDetail } from "@/features/consultations/student-consultation-detail";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "تفاصيل الاستشارة" };

/** Postgres-free distinction: bookings are UUIDs, consultations are legacy ids or catalog slugs. */
const BOOKING_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/students/consultations/[bookingId]">) {
  const { bookingId } = await params;
  if (BOOKING_ID.test(bookingId)) {
    return (
      <section aria-labelledby="student-consultation-title">
        <StudentPageHeader id="student-consultation-title" title="تفاصيل الاستشارة" />
        <ConsultationPage bookingId={bookingId} />
      </section>
    );
  }

  // A consultation the customer owns (`/students/consultations/37` or its catalog slug).
  const data = await getConsultationDetail(decodeURIComponent(bookingId));
  if (!data) {
    return (
      <section aria-labelledby="student-consultation-title">
        <StudentPageHeader id="student-consultation-title" title="تفاصيل الاستشارة" />
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <p className="m-0 font-bold">لم نعد نعرض تفاصيل هذه الاستشارة</p>
          <p className="m-0 text-fg-muted">
            ربما أزالها الخبير من المتجر. يبقى وصولك محفوظاً في حسابك، ويمكنك مراجعة حجوزاتك أو التواصل مع الدعم.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <AppLink href={routes.studentConsultations} className="ma-btn ma-btn--soft min-h-11">
              استشاراتي
            </AppLink>
            <AppLink href={routes.studentSupportNew} className="ma-btn ma-btn--ghost min-h-11">
              تواصل مع الدعم
            </AppLink>
          </div>
        </div>
      </section>
    );
  }
  return <StudentConsultationDetail data={data} />;
}
