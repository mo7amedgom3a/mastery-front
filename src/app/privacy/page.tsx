import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { privacy } from "@/features/legal/content/privacy";
import { LegalPage } from "@/features/legal/legal-page";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
  alternates: {
    canonical: routes.privacy,
    languages: { ar: routes.privacy, "x-default": routes.privacy },
  },
  openGraph: {
    ...baseOpenGraph,
    url: routes.privacy,
    title: privacy.title,
    description: privacy.description,
  },
};

export default function PrivacyRoute() {
  return <LegalPage document={privacy} related={{ label: "الشروط والأحكام", href: routes.terms }} />;
}
