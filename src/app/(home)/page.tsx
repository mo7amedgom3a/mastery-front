import type { Metadata } from "next";
import { connection } from "next/server";

import { baseOpenGraph, siteConfig } from "@/config/site";
import { getExpertCards } from "@/features/experts-directory/api/get-expert-cards";
import { getLandingData } from "@/features/landing/api/get-landing-data";
import { LandingPage } from "@/features/landing/landing-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: siteConfig.title },
  alternates: {
    canonical: "/",
    languages: { ar: "/", "x-default": "/" },
  },
  // Replaces the layout's openGraph object, so it restates the shared fields; the image still comes
  // from app/opengraph-image.jpg.
  openGraph: {
    ...baseOpenGraph,
    url: "/",
    title: `${siteConfig.name} | ${siteConfig.nameEn}`,
    description: siteConfig.shareDescription,
  },
};

export default async function HomePage() {
  await connection();
  const [data, experts] = await Promise.all([
    getLandingData(),
    // The experts section keeps its curated line-up when the directory is unavailable.
    getExpertCards().catch((error: unknown) => {
      console.error("[api] experts request failed", error);
      return [];
    }),
  ]);
  return <LandingPage data={data} experts={experts} />;
}
