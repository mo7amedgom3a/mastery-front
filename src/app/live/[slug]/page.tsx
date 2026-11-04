import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { baseOpenGraph } from "@/config/site";
import { getLiveTrainingDetail } from "@/features/live-training/api/get-live-trainings";
import { LiveTrainingDetailPage } from "@/features/live-training/live-training-detail-page";
import { toPlainText } from "@/lib/format";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/live/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const training = await getLiveTrainingDetail(slug);
  if (!training) {
    return {};
  }
  const title = `${training.title} — بث مباشر مع ${training.trainerName}`;
  // Length budgets from config/site: description ≤ 155, share description ≤ 125.
  const source = training.summary ?? training.subtitle ?? title;
  const description = toPlainText(source, 155) ?? title;
  const shareDescription = toPlainText(source, 120) ?? title;
  return {
    title,
    description,
    alternates: {
      canonical: training.href,
      languages: { ar: training.href, "x-default": training.href },
    },
    openGraph: {
      ...baseOpenGraph,
      url: training.href,
      title,
      description: shareDescription,
      ...(training.coverImage ? { images: [{ url: training.coverImage, alt: training.title }] } : {}),
    },
  };
}

export default async function LiveTrainingPage({ params }: PageProps<"/live/[slug]">) {
  await connection();
  const { slug } = await params;
  const training = await getLiveTrainingDetail(slug);
  if (!training) {
    notFound();
  }
  return <LiveTrainingDetailPage training={training} />;
}
