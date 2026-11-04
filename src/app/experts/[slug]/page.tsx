import type { Metadata } from "next";
import { connection } from "next/server";

import { expertMetadata, loadExpertPage } from "@/features/expert-detail/api/load-expert-page";
import { ExpertDetailPage } from "@/features/expert-detail/expert-detail-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/experts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return expertMetadata(slug);
}

export default async function ExpertPage({ params }: PageProps<"/experts/[slug]">) {
  await connection();
  const { slug } = await params;
  const data = await loadExpertPage(slug);
  return <ExpertDetailPage data={data} />;
}
