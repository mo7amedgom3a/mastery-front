import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getAffiliateProgram } from "@/features/marketer-application/api/program";
import { marketersPageCopy } from "@/features/marketers/content/copy";
import { MarketersPage } from "@/features/marketers/marketers-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 600;

export const metadata: Metadata = {
  title: marketersPageCopy.metaTitle,
  description: marketersPageCopy.description,
  alternates: {
    canonical: routes.marketers,
    languages: { ar: routes.marketers, "x-default": routes.marketers },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.marketers,
    title: marketersPageCopy.title,
    description: marketersPageCopy.description,
  },
};

export default async function MarketersRoute() {
  await connection();
  return <MarketersPage terms={await getAffiliateProgram()} />;
}
