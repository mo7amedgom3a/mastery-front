import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { marketersPageCopy } from "@/features/marketers/content/copy";
import { MarketersPage } from "@/features/marketers/marketers-page";
import { apiRequest } from "@/lib/api/client";

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

type AffiliateProgramResponse = {
  applications_open: boolean;
  commission_percent: string | number;
  cookie_days: number;
  payout_terms: string;
  minimum_payout_minor: number;
};

const DEFAULT_TERMS: AffiliateProgramResponse = {
  applications_open: true,
  commission_percent: "20.00",
  cookie_days: 30,
  payout_terms: "PayPal · NET-15",
  minimum_payout_minor: 0,
};

export default async function MarketersRoute() {
  const terms = await apiRequest<AffiliateProgramResponse>("GET", "/api/v1/affiliates/program", {
    next: { revalidate: 300 },
  }).catch(() => DEFAULT_TERMS);

  return <MarketersPage terms={terms} />;
}
