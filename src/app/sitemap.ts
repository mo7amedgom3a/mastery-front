import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { getLiveTrainingSlugs } from "@/features/live-training/api/get-live-trainings";
import { emptySearchState, PRODUCT_TYPES, searchHref } from "@/features/search/model/params";
import { getAllCatalogCards, getCatalogExperts, parseCardSlug } from "@/lib/api/browse";
import { getSearchOptions } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

// Regenerated with the catalog: new courses appear within the hour, or at once via /api/revalidate.
export const revalidate = 3600;

const read = cachedRead(revalidate, ["sitemap"]);

// Cards carry the product's `updated_at`, used as `lastModified`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const home = `${siteUrl}/`;

  const [cards, experts, searchOptions, liveSlugs] = await Promise.allSettled([
    // Every published course, diploma, package, consultation and bundle, with its slug and update time.
    getAllCatalogCards({ product_type: ["course", "diploma", "package", "consultation", "bundle"] }, read),
    // Only experts with something to offer.
    getCatalogExperts({ limit: 500 }, read),
    getSearchOptions({ limit: 500 }, read),
    getLiveTrainingSlugs(),
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
    page(routes.business, 0.8),
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
      // The landing page is rebuilt on every deploy and refreshed by ISR, so build time is honest.
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
  ];
}
