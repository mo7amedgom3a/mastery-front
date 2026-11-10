import { getSiteUrl } from "@/config/env";
import { siteConfig } from "@/config/site";
import { JsonLd, organizationId, websiteId } from "@/lib/seo/json-ld";

/**
 * The brand entity graph, rendered once in the root layout on every page. Page-level graphs
 * reference these `@id`s instead of redefining the academy, so Google and AI answer engines see one
 * consistent Organization across the site.
 */
export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const orgId = organizationId();

  const graph: Record<string, unknown>[] = [
    {
      "@type": "EducationalOrganization",
      "@id": orgId,
      name: siteConfig.name,
      alternateName: siteConfig.nameEn,
      url: `${siteUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}${siteConfig.logo.url}`,
        width: siteConfig.logo.width,
        height: siteConfig.logo.height,
      },
      description: siteConfig.description,
      foundingDate: String(siteConfig.foundingYear),
      founder: siteConfig.founders.map((name) => ({ "@type": "Person", name })),
      inLanguage: "ar",
      knowsAbout: [...siteConfig.knowsAbout],
      ...(siteConfig.social.length > 0 ? { sameAs: [...siteConfig.social] } : {}),
    },
    {
      "@type": "WebSite",
      "@id": websiteId(),
      url: `${siteUrl}/`,
      name: siteConfig.name,
      alternateName: siteConfig.nameEn,
      inLanguage: "ar",
      publisher: { "@id": orgId },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return <JsonLd graph={graph} />;
}
