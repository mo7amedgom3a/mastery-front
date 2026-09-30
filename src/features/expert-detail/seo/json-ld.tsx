import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import { expertRoles } from "../model/facts";
import type { ExpertVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The profile as a ProfilePage about a Person (their fields, social profiles) and its breadcrumb trail. */
export function ExpertJsonLd({ expert }: { expert: ExpertVM }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${expert.href}`;
  const roles = expertRoles(expert.counts);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: expert.name,
      inLanguage: "ar",
      mainEntity: {
        "@type": "Person",
        "@id": `${url}#person`,
        name: expert.name,
        url,
        ...(expert.avatar ? { image: expert.avatar } : {}),
        ...(expert.summary ? { description: expert.summary } : {}),
        ...(roles.length > 0 ? { jobTitle: roles.join(" و") } : {}),
        ...(expert.specialties.length > 0 ? { knowsAbout: expert.specialties } : {}),
        ...(expert.socials.length > 0 ? { sameAs: expert.socials.map((link) => link.href) } : {}),
        worksFor: { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl },
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "الخبراء", item: `${siteUrl}${routes.section("experts")}` },
        { "@type": "ListItem", position: 3, name: expert.name, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Safe: static structure, JSON-serialised and `<`-escaped above.
      dangerouslySetInnerHTML={{ __html: serialize({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
