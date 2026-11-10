import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getAllBlogPosts } from "@/features/blog/api/get-blog-posts";

// Data-cached for an hour; the response itself is cacheable at the CDN for a day.
export const revalidate = 3600;

const BLOG_DESCRIPTION =
  "مقالات من خبراء ماستري في التسويق الرقمي والقيادة وريادة الأعمال والتجارة الإلكترونية.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 for the blog: a crawlable, syndicatable index that AI answer engines can also read. */
export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getAllBlogPosts().catch((error: unknown) => {
    console.error("[feed] blog posts request failed", error);
    return [];
  });

  const items = posts
    .filter((post) => post.published_at)
    .slice(0, 20)
    .map((post) => {
      const url = `${siteUrl}${routes.blogPost(post.slug)}`;
      const pubDate = post.published_at ? new Date(post.published_at) : null;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        ...(pubDate && !Number.isNaN(pubDate.getTime()) ? [`      <pubDate>${pubDate.toUTCString()}</pubDate>`] : []),
        `      <description>${escapeXml(post.summary ?? "")}</description>`,
        ...(post.author?.name ? [`      <dc:creator>${escapeXml(post.author.name)}</dc:creator>`] : []),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild = posts
    .map((post) => (post.published_at ? new Date(post.published_at).getTime() : 0))
    .filter((time) => Number.isFinite(time) && time > 0)
    .sort((a, b) => b - a)[0];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>مدونة ${siteConfig.name}</title>`,
    `    <link>${escapeXml(`${siteUrl}${routes.blog}`)}</link>`,
    `    <description>${escapeXml(BLOG_DESCRIPTION)}</description>`,
    "    <language>ar</language>",
    `    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    ...(lastBuild ? [`    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>`] : []),
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
