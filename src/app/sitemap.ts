import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { getAllBlogPosts } from "@/features/blog/api/get-blog-posts";
import { authorProfiles } from "@/features/blog/data/author-profiles";
import { getLiveTrainingSlugs } from "@/features/live-training/api/get-live-trainings";
import { emptySearchState, PRODUCT_TYPES, searchHref } from "@/features/search/model/params";
import { getAllCatalogCards, getCatalogExperts, parseCardSlug } from "@/lib/api/browse";
import { getSearchOptions } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

// Built per request (`connection()` below), never prerendered: Amplify does not finish ISR background
// regeneration, so a build-time copy would never pick up new products. The catalog reads stay in the
// data cache for an hour, or until POST /api/revalidate refreshes them.
export const revalidate = 3600;

const read = cachedRead(revalidate, ["sitemap"]);

// Cards carry the product's `updated_at`, used as `lastModified`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const siteUrl = getSiteUrl();
  const home = `${siteUrl}/`;

  const [cards, experts, searchOptions, liveSlugs, blogPosts] = await Promise.allSettled([
    // Every published course, diploma, package, consultation and bundle, with its slug and update time.
    getAllCatalogCards({ product_type: ["course", "diploma", "package", "consultation", "bundle"] }, read),
    // Only experts with something to offer.
    getCatalogExperts({ limit: 500 }, read),
    getSearchOptions({ limit: 500 }, read),
    getLiveTrainingSlugs(),
    getAllBlogPosts(),
  ]);

  // The listings: the search page as a whole, per product type and per category that has products.
  // Same URLs as the pages' canonicals (`searchHref`); finer filter combinations are noindexed.
  const listing = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority,
  });
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "monthly",
    priority,
  });
  const listings = [
    listing(searchHref(emptySearchState), 0.9),
    listing(routes.live, 0.8),
    listing(routes.experts, 0.8),
    page(routes.business, 0.8),
    page(routes.businessB2b, 0.7),
    { url: `${siteUrl}${routes.blog}`, changeFrequency: "weekly" as const, priority: 0.8 },
    page(routes.trainers, 0.7),
    page(routes.terms, 0.3),
    page(routes.privacy, 0.3),
    ...PRODUCT_TYPES.map((type) => listing(searchHref({ ...emptySearchState, types: [type] }), 0.9)),
    ...(valueOf(searchOptions, "sitemap search options")?.categories ?? [])
      .filter((category) => category.count > 0)
      .map((category) => listing(searchHref({ ...emptySearchState, categories: [category.code.toLowerCase()] }), 0.7)),
  ];

  const products = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const card of valueOf(cards, "sitemap products") ?? []) {
    const parsed = parseCardSlug(card.slug);
    let path: string | null = null;
    let priority = 0.7;
    if (parsed?.kind === "course") path = routes.course(parsed.id);
    else if (parsed?.kind === "diploma") (path = routes.diploma(parsed.id)), (priority = 0.8);
    else if (parsed?.kind === "package") (path = routes.package(parsed.id)), (priority = 0.8);
    else if (parsed?.kind === "consultation") (path = routes.consultation(parsed.id)), (priority = 0.6);
    else if (card.product_type === "bundle") (path = routes.bundle(card.slug)), (priority = 0.8);
    if (!path) continue;
    const url = `${siteUrl}${path}`;
    products.set(url, {
      url,
      lastModified: card.updated_at ? new Date(card.updated_at) : undefined,
      changeFrequency: "weekly",
      priority,
    });
  }
  for (const dto of valueOf(experts, "sitemap experts") ?? []) {
    const name = dto.name?.trim();
    if (!name) continue;
    const url = `${siteUrl}${routes.expert(dto.key, name)}`;
    products.set(url, { url, changeFrequency: "weekly", priority: 0.5 });
  }

  return [
    {
      url: home,
      // The landing page is rendered per request, so it is always current.
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: { ar: home, "x-default": home } },
    },
    ...listings,
    ...products.values(),
    ...(valueOf(liveSlugs, "sitemap live trainings") ?? []).map((slug): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}${routes.liveTraining(slug)}`,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...(valueOf(blogPosts, "sitemap blog") ?? []).map((post): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}${routes.blogPost(post.slug)}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${siteUrl}${routes.blogAuthors}`, changeFrequency: "monthly" as const, priority: 0.7 },
    ...authorProfiles.map((profile): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}${routes.blogAuthor(profile.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
