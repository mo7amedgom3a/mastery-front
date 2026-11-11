import type { Metadata } from "next";

import { consultationMetadata, loadConsultationPage } from "@/features/consultation-detail/api/load-consultation-page";
import { ConsultationDetailPage } from "@/features/consultation-detail/consultation-detail-page";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
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
