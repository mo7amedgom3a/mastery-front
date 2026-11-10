import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { organizationRef, websiteRef } from "@/lib/seo/json-ld";

import type { AuthorExpertFacts } from "../api/get-blog-author-page";
import type { AuthorProfile } from "../data/author-profiles";
import type { BlogCardVM } from "../model/types";

function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function absolute(url: string | null, siteUrl: string): string | null {
  if (!url) return null;
  if (/^(?:https?:)?\/\//i.test(url)) return url.startsWith("//") ? `https:${url}` : url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** ProfilePage + Person for a curated author, with their articles as an ordered list. */
export function AuthorJsonLd({
  profile,
  expert,
  posts,
}: {
  profile: AuthorProfile;
  expert: AuthorExpertFacts | null;
  posts: BlogCardVM[];
}) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.blogAuthor(profile.slug)}`;
  const image = absolute(profile.portrait.src, siteUrl);
  const sameAs = [expert?.facebook, expert?.instagram, expert?.youtube].filter(
    (value): value is string => Boolean(value),
  );

  const graph: Record<string, unknown>[] = [
    {
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: `${profile.name} — ${profile.title}`,
      description: profile.tagline,
      inLanguage: "ar",
      isPartOf: websiteRef(),
      mainEntity: { "@id": `${url}#person` },
    },
    {
      "@type": "Person",
      "@id": `${url}#person`,
      name: profile.name,
      alternateName: profile.englishName,
      jobTitle: profile.title,
      description: profile.tagline,
      ...(image ? { image } : {}),
      url,
      worksFor: organizationRef(),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      knowsAbout: profile.focus,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "المدونة", item: `${siteUrl}${routes.blog}` },
        { "@type": "ListItem", position: 3, name: "الخبراء", item: `${siteUrl}${routes.blogAuthors}` },
        { "@type": "ListItem", position: 4, name: profile.name, item: url },
      ],
    },
  ];

  if (posts.length > 0) {
    graph.push({
      "@type": "ItemList",
      name: `مقالات ${profile.name}`,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${post.href}`,
        name: post.title,
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serialize({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
