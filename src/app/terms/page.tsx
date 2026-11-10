import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { terms } from "@/features/legal/content/terms";
import { LegalPage } from "@/features/legal/legal-page";
import { LegalJsonLd } from "@/features/legal/seo/json-ld";

export const metadata: Metadata = {
  title: terms.title,
  description: terms.description,
  alternates: {
    canonical: routes.terms,
    languages: { ar: routes.terms, "x-default": routes.terms },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.terms,
    title: terms.title,
    description: terms.description,
  },
};

export default function TermsRoute() {
  return (
    <>
      <LegalPage document={terms} related={{ label: "سياسة الخصوصية", href: routes.privacy }} />
      <LegalJsonLd path={routes.terms} title={terms.title} description={terms.description} updated={terms.updated} />
    </>
  );
}
