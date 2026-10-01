import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getBusinessCatalog } from "@/features/business/api/get-business-catalog";
import { BusinessPage } from "@/features/business/business-page";
import { businessPageCopy } from "@/features/business/content/b2b";

// ISR: the copy is static; the category and topic chips follow the search catalog.
export const revalidate = 600;

export const metadata: Metadata = {
  title: businessPageCopy.kicker,
  description: businessPageCopy.description,
  alternates: {
    canonical: routes.business,
    languages: { ar: routes.business, "x-default": routes.business },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.business,
    title: businessPageCopy.kicker,
    description: businessPageCopy.description,
  },
};

export default async function BusinessRoute() {
  const catalog = await getBusinessCatalog();
  return <BusinessPage catalog={catalog} />;
}
