import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getSearchCatalog } from "@/features/search/api/get-search-page";
import { trainersPageCopy } from "@/features/trainers/content/copy";
import { TrainersPage } from "@/features/trainers/trainers-page";
import { getCatalogCategories, getOnboardingOptions } from "@/lib/api/catalog";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
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
  await connection();
  const catalog = await getSearchCatalog();
  const [categories, onboarding] = await Promise.all([
    getCatalogCategories().catch(() => []),
    getOnboardingOptions().catch(() => ({ skills: [], tags: [], product_types: [] })),
  ]);
  return <TrainersPage specialities={[...catalog.categoryNames.values()].map((name) => name.trim())}
    categories={categories} skills={onboarding.skills ?? []} />;
}
