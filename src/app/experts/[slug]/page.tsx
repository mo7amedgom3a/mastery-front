import type { Metadata } from "next";

import { expertMetadata, loadExpertPage } from "@/features/expert-detail/api/load-expert-page";
import { ExpertDetailPage } from "@/features/expert-detail/expert-detail-page";

// ISR: each expert profile is built on its first visit, then refreshed at most every 5 minutes or on
// demand via POST /api/revalidate. Keep in sync with EXPERT_REVALIDATE_SECONDS.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/experts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return expertMetadata(slug);
}

export default async function ExpertPage({ params }: PageProps<"/experts/[slug]">) {
  const { slug } = await params;
  const data = await loadExpertPage(slug);
  return <ExpertDetailPage data={data} />;
}
