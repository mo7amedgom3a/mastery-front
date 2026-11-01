import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import type { BlogPostVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function absolute(url: string | null, siteUrl: string): string | null {
  if (!url) return null;
  if (/^(?:https?:)?\/\//i.test(url)) return url.startsWith("//") ? `https:${url}` : url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** The article as schema.org Article, with the author's expert page and the breadcrumb trail. */
export function BlogJsonLd({ post }: { post: BlogPostVM }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${post.href}`;
  const image = absolute(post.cover, siteUrl);
  const authorUrl = post.author ? `${siteUrl}${post.author.href}` : null;
  const logo = absolute(siteConfig.logo.url, siteUrl);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.summary || siteConfig.description,
      ...(image ? { image: [image] } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt, dateModified: post.publishedAt } : {}),
      inLanguage: "ar",
      ...(post.author
        ? {
            author: {
              "@type": "Person",
              name: post.author.name,
              ...(authorUrl ? { url: authorUrl } : {}),
              ...(post.author.avatar ? { image: absolute(post.author.avatar, siteUrl) } : {}),
            },
          }
        : { author: { "@type": "Organization", name: siteConfig.name, url: siteUrl } }),
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteUrl,
        ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(post.bodyTags.length > 0 ? { keywords: post.bodyTags.join(", ") } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "المدونة", item: `${siteUrl}${routes.blog}` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
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
