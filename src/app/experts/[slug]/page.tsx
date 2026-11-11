import type { Metadata } from "next";

import { expertMetadata, loadExpertPage } from "@/features/expert-detail/api/load-expert-page";
import { ExpertDetailPage } from "@/features/expert-detail/expert-detail-page";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
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
