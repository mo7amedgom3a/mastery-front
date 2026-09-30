import type { Metadata } from "next";

import { consultationMetadata, loadConsultationPage } from "@/features/consultation-detail/api/load-consultation-page";
import { ConsultationDetailPage } from "@/features/consultation-detail/consultation-detail-page";

// ISR: each consultation page is built on its first visit, then refreshed at most every 5 minutes or
// on demand via POST /api/revalidate. Keep in sync with CONSULTATION_REVALIDATE_SECONDS.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/consultations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return consultationMetadata(slug);
}

export default async function ConsultationPage({ params }: PageProps<"/consultations/[slug]">) {
  const { slug } = await params;
  const data = await loadConsultationPage(slug);
  return <ConsultationDetailPage data={data} />;
}
