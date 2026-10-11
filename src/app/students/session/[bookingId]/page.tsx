import type { Metadata } from "next";

import { ConsultationRoom } from "@/features/consultation-room/consultation-room";

export const metadata: Metadata = { title: "جلسة الاستشارة" };

/** Full-screen meeting room: no dashboard chrome around the video. */
export default async function Page({ params }: PageProps<"/students/session/[bookingId]">) {
  const { bookingId } = await params;
  return <ConsultationRoom bookingId={bookingId} />;
}
