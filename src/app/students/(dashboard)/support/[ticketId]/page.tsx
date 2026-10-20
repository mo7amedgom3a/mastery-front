import type { Metadata } from "next";

import { SupportDetailPage } from "@/features/support/support-detail-page";

export const metadata: Metadata = {
  title: "تفاصيل تذكرة الدعم | ماستري أكاديمي",
};

export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <SupportDetailPage ticketId={ticketId} />;
}
