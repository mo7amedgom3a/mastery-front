import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { JsonLd, breadcrumbList, organizationRef } from "@/lib/seo/json-ld";

import type { ExpertVM } from "../model/types";

/** The profile as a ProfilePage about a top-level Person entity, plus its breadcrumb trail. */
export function ExpertJsonLd({ expert }: { expert: ExpertVM }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${expert.href}`;
  const { roles } = expert;

  const person = {
    "@type": "Person",
    "@id": `${url}#person`,
    name: expert.name,
    url,
    ...(expert.avatar ? { image: expert.avatar } : {}),
    ...(expert.summary ? { description: expert.summary } : {}),
    ...(roles.length > 0 ? { jobTitle: roles.join(" و") } : {}),
    ...(expert.specialties.length > 0 ? { knowsAbout: expert.specialties } : {}),
    ...(expert.socials.length > 0 ? { sameAs: expert.socials.map((link) => link.href) } : {}),
    worksFor: organizationRef(),
  };

  return (
    <JsonLd
      graph={[
        {
          "@type": "ProfilePage",
          "@id": `${url}#profile`,
          url,
          name: expert.name,
          inLanguage: "ar",
          isPartOf: { "@id": `${siteUrl}/#website` },
          mainEntity: { "@id": `${url}#person` },
        },
        person,
        breadcrumbList([
          { name: "الرئيسية", item: `${siteUrl}/` },
          { name: "الخبراء", item: `${siteUrl}${routes.section("experts")}` },
          { name: expert.name, item: url },
        ]),
      ]}
    />
  );
}
