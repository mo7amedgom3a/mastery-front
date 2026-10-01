import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { baseOpenGraph } from "@/config/site";
import { getLiveTrainingDetail, getLiveTrainingSlugs } from "@/features/live-training/api/get-live-trainings";
import { LiveTrainingDetailPage } from "@/features/live-training/live-training-detail-page";
import { toPlainText } from "@/lib/format";

// ISR, like the course pages: built ahead from the known slugs, refreshed at most every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getLiveTrainingSlugs()).map((slug) => ({ slug }));
}

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
  const { slug } = await params;
  const training = await getLiveTrainingDetail(slug);
  if (!training) {
    notFound();
  }
  return <LiveTrainingDetailPage training={training} />;
}
