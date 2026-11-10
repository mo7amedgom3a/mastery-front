import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { JsonLd, breadcrumbList, faqPage, organizationRef } from "@/lib/seo/json-ld";

import type { BlogPostVM } from "../model/types";

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
  const dateModified = post.updatedAt ?? post.publishedAt;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.summary || siteConfig.description,
      ...(image ? { image: [image] } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
      ...(dateModified ? { dateModified } : {}),
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
        : { author: organizationRef() }),
      publisher: organizationRef(),
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(post.bodyTags.length > 0 ? { keywords: post.bodyTags.join(", ") } : {}),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: "المدونة", item: `${siteUrl}${routes.blog}` },
      { name: post.title, item: url },
    ]),
  ];

  if (post.faqs.length > 0) graph.push(faqPage(post.faqs));

  return <JsonLd graph={graph} />;
}
