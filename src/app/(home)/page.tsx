import type { Metadata } from "next";

import { baseOpenGraph, siteConfig } from "@/config/site";
import { getExpertCards } from "@/features/experts-directory/api/get-expert-cards";
import { getLandingData } from "@/features/landing/api/get-landing-data";
import { LandingPage } from "@/features/landing/landing-page";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
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
