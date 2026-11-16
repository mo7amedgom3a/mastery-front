import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLabsApiMode } from "@/features/labs/api/client";

import { LabPreviewLoader } from "./loader";

export const metadata: Metadata = {
  title: "معاينة مختبر",
  robots: { index: false, follow: false },
};

/** Mock-only preview of an admin-authored lab. Live mode serves the admin Studio preview instead. */
export default async function LabPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  if (getLabsApiMode() === "live") notFound();
  const { slug } = await params;
  return <LabPreviewLoader slug={slug} />;
}
