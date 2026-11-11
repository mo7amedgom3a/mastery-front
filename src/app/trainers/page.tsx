import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getSearchCatalog } from "@/features/search/api/get-search-page";
import { trainersPageCopy } from "@/features/trainers/content/copy";
import { TrainersPage } from "@/features/trainers/trainers-page";
import { getCatalogCategories, getOnboardingOptions } from "@/lib/api/catalog";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 600;

export const metadata: Metadata = {
  title: trainersPageCopy.metaTitle,
  description: trainersPageCopy.description,
  alternates: {
    canonical: routes.trainers,
    languages: { ar: routes.trainers, "x-default": routes.trainers },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.trainers,
    title: trainersPageCopy.title,
    description: trainersPageCopy.description,
  },
};

export default async function TrainersRoute() {
  const catalog = await getSearchCatalog();
  const [categories, onboarding] = await Promise.all([
    getCatalogCategories().catch(() => []),
    getOnboardingOptions().catch(() => ({ skills: [], tags: [], product_types: [] })),
  ]);
  return <TrainersPage specialities={[...catalog.categoryNames.values()].map((name) => name.trim())}
    categories={categories} skills={onboarding.skills ?? []} />;
}
