import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getAffiliateProgram } from "@/features/marketer-application/api/program";
import { marketersPageCopy } from "@/features/marketers/content/copy";
import { MarketersPage } from "@/features/marketers/marketers-page";

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
  return <MarketersPage terms={await getAffiliateProgram()} />;
}
