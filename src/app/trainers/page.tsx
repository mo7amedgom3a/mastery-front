import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getSearchCatalog } from "@/features/search/api/get-search-page";
import { trainersPageCopy } from "@/features/trainers/content/copy";
import { TrainersPage } from "@/features/trainers/trainers-page";

// ISR: the copy is static; the speciality list follows the catalog's categories.
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
  return <TrainersPage specialities={[...catalog.categoryNames.values()].map((name) => name.trim())} />;
}
