import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getLiveTrainings } from "@/features/live-training/api/get-live-trainings";
import { livePageCopy } from "@/features/live-training/content/copy";
import { LivePage } from "@/features/live-training/live-page";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export const metadata: Metadata = {
  title: livePageCopy.title,
  description: livePageCopy.description,
  alternates: {
    canonical: routes.live,
    languages: { ar: routes.live, "x-default": routes.live },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.live,
    title: livePageCopy.title,
    description: livePageCopy.description,
  },
};

export default async function LiveTrainingsPage() {
  // A failed read must not fail the build; the page refills on its next revalidation.
  const trainings = await getLiveTrainings().catch((error: unknown) => {
    console.error("[api] live trainings request failed", error);
    return [];
  });
  return <LivePage trainings={trainings} />;
}
