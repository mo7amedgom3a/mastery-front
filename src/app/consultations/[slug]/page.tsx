import type { Metadata } from "next";
import { connection } from "next/server";

import { consultationMetadata, loadConsultationPage } from "@/features/consultation-detail/api/load-consultation-page";
import { ConsultationDetailPage } from "@/features/consultation-detail/consultation-detail-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/consultations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return consultationMetadata(slug);
}

export default async function ConsultationPage({ params }: PageProps<"/consultations/[slug]">) {
  await connection();
  const { slug } = await params;
  const data = await loadConsultationPage(slug);
  return <ConsultationDetailPage data={data} />;
}
