import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExpertDetail } from "@/features/expert-detail/api/get-expert-detail";
import { LiveExpertBody } from "@/features/expert-detail/components/live-expert-body";
import { ExpertDetailPage } from "@/features/expert-detail/expert-detail-page";
import { parseExpertSlug } from "@/config/routes";

// The admin Studio frames this page: always the current profile, never a cached one.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * `/preview/expert/{key}`: the real expert page, read fresh, with its body driven live by the admin Studio (the page
 * being built, or the README being edited) (postMessage, see `useStudioChannel`). Framing is limited to the admin by the
 * `/preview/*` headers in next.config.ts.
 */
export default async function ExpertPreviewRoute({ params }: PageProps<"/preview/expert/[key]">) {
  const { key: raw } = await params;
  const key = parseExpertSlug(decodeURIComponent(raw));
  const data = key ? await getExpertDetail(key, true) : null;
  if (!data) {
    notFound();
  }
  return <ExpertDetailPage data={data} body={<LiveExpertBody data={data} />} />;
}
