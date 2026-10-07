import type { Metadata } from "next";

import { baseOpenGraph, siteConfig } from "@/config/site";
import { getLandingData } from "@/features/landing/api/get-landing-data";
import { LandingPage } from "@/features/landing/landing-page";

// ISR: regenerate at most every 5 minutes, or on demand via POST /api/revalidate.
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
  const data = await getLandingData();
  return <LandingPage data={data} />;
}
