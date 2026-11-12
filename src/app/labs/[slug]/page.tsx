import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LabPage } from "@/features/labs/components/lab-page";
import { findLab, labs } from "@/features/labs/model/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lab = findLab(slug);
  return lab ? { title: lab.title, description: lab.tagline } : {};
}

export default async function LabRoute({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  const lab = findLab(slug);
  if (!lab) notFound();
  return <LabPage slug={lab.slug} />;
}
