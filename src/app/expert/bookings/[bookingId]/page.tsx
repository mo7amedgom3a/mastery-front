import type { Metadata } from "next";

import { ExpertBookingDetailPage } from "@/features/expert-dashboard/booking-detail-page";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "تفاصيل الحجز" };

export default async function Page({ params }: PageProps<"/expert/bookings/[bookingId]">) {
  const { bookingId } = await params;
  return (
    <section aria-labelledby="expert-booking-title">
      <StudentPageHeader id="expert-booking-title" title="تفاصيل الحجز" />
      <ExpertBookingDetailPage bookingId={bookingId} />
    </section>
  );
}
