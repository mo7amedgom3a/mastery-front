import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { JsonLd, breadcrumbList, itemList, organizationRef, webPage } from "@/lib/seo/json-ld";

import type { AuthorProfile } from "../data/author-profiles";
import type { BlogCardVM } from "../model/types";

const BLOG_DESCRIPTION =
  "مقالات من خبراء ماستري في التسويق الرقمي والقيادة وريادة الأعمال والتجارة الإلكترونية: أفكار عملية، وأدلة تطبيقية، وقراءات هادئة بلا ضجيج.";

/** `/blog`: the index as a Blog + ItemList + breadcrumb trail. */
export function BlogIndexJsonLd({ posts }: { posts: readonly BlogCardVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.blog}`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({ url, name: "مدونة ماستري", description: BLOG_DESCRIPTION }),
      "@id": `${url}#blog`,
      "@type": "Blog",
      name: "مدونة ماستري",
      description: BLOG_DESCRIPTION,
      inLanguage: "ar",
      publisher: organizationRef(),
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: `${siteUrl}${post.href}`,
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        ...(post.cover ? { image: post.cover } : {}),
        ...(post.summary ? { description: post.summary } : {}),
      })),
      mainEntity: itemList(
        "مقالات مدونة ماستري",
        posts.map((post) => ({ name: post.title, url: `${siteUrl}${post.href}` })),
      ),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: "المدونة", item: url },
    ]),
  ];

  return <JsonLd graph={graph} />;
}

/** `/blog/authors`: the curated authors as a CollectionPage of Person entities. */
export function AuthorIndexJsonLd({ profiles }: { profiles: readonly AuthorProfile[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.blogAuthors}`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({
        url,
        name: "الخبراء – مدونة ماستري",
        description:
          "تعرّف على خبراء مدونة ماستري: مسيرتهم، إنجازاتهم، ومقالاتهم في التسويق والقيادة وريادة الأعمال.",
      }),
      "@id": `${url}#collection`,
      "@type": "CollectionPage",
      mainEntity: itemList(
        `خبراء ${siteConfig.name}`,
        profiles.map((profile) => ({ name: profile.name, url: `${siteUrl}${routes.blogAuthor(profile.slug)}` })),
      ),
      about: profiles.map((profile) => ({
        "@type": "Person",
        name: profile.name,
        alternateName: profile.englishName,
        url: `${siteUrl}${routes.blogAuthor(profile.slug)}`,
        image: `${siteUrl}${profile.portrait.src}`,
        jobTitle: profile.title,
        description: profile.tagline,
        ...(profile.focus.length > 0 ? { knowsAbout: profile.focus } : {}),
        worksFor: organizationRef(),
      })),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: "المدونة", item: `${siteUrl}${routes.blog}` },
      { name: "الخبراء", item: url },
    ]),
  ];

  return <JsonLd graph={graph} />;
}
