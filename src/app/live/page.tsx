import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getLiveTrainings } from "@/features/live-training/api/get-live-trainings";
import { livePageCopy } from "@/features/live-training/content/copy";
import { LivePage } from "@/features/live-training/live-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
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
  await connection();
  // A failed read must not fail the build; the page refills on its next revalidation.
  const trainings = await getLiveTrainings().catch((error: unknown) => {
    console.error("[api] live trainings request failed", error);
    return [];
  });
  return <LivePage trainings={trainings} />;
}
