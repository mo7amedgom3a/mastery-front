import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getLabsApiMode } from "@/features/labs/api/client";
import { LabPage } from "@/features/labs/components/lab-page";
import { LiveLabPage } from "@/features/labs/engines/live-lab-page";
import { findLab, labs } from "@/features/labs/model/catalog";

// Live mode serves labs created in the admin (no deploy), so unknown slugs are resolved at runtime;
// mock mode still 404s anything outside the bundled catalog.
export const dynamicParams = true;

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lab = findLab(slug);
  if (lab) return { title: lab.title, description: lab.tagline };
  return getLabsApiMode() === "live" ? { title: "المختبرات العملية" } : {};
}

export default async function LabRoute({ params }: PageProps<"/labs/[slug]">) {
  const { slug } = await params;
  if (getLabsApiMode() === "live") {
    return (
      <Suspense fallback={<div className="ma-container py-16 text-center text-sm text-fg-muted">جارٍ تحميل المختبر…</div>}>
        <LiveLabPage slug={slug} />
      </Suspense>
    );
  }
  const lab = findLab(slug);
  if (!lab) notFound();
  return <LabPage slug={lab.slug} />;
}
