import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { isPublishedBundle } from "@/features/bundle-detail/model/mappers";
import { isPublishable, type CourseDto } from "@/features/landing/model/mappers";
import { getLiveTrainingSlugs } from "@/features/live-training/api/get-live-trainings";
import { emptySearchState, PRODUCT_TYPES, searchHref } from "@/features/search/model/params";
import {
  getLegacyConsultations,
  getLegacyCourses,
  getLegacyDiplomas,
  getLegacyExperts,
  getLegacyPackages,
} from "@/lib/api/legacy";
import { getCatalogProducts } from "@/lib/api/catalog";
import { getSearchOptions } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

// Regenerated with the catalog: new courses appear within the hour, or at once via /api/revalidate.
export const revalidate = 3600;

/** API maximum page size for legacy lists. */
const PAGE_SIZE = 200;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 20;
const read = cachedRead(revalidate, ["sitemap"]);

async function allPages(fetchPage: (offset: number) => Promise<{ items: CourseDto[]; total: number }>) {
  const items: CourseDto[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchPage(page * PAGE_SIZE);
    items.push(...result.items);
    if (result.items.length < PAGE_SIZE || items.length >= result.total) break;
  }
  return items;
}

// Detail pages have no updated-at date in the API, so they carry no `lastModified` rather than a
// made-up one.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const home = `${siteUrl}/`;

  const [courses, diplomas, packages, consultations, bundles, experts, searchOptions] = await Promise.allSettled([
    allPages((offset) => getLegacyCourses({ limit: PAGE_SIZE, offset }, read)),
    allPages((offset) => getLegacyDiplomas({ active: true, limit: PAGE_SIZE, offset }, read)),
    // Packages number in the tens: one page covers them.
    getLegacyPackages({ limit: PAGE_SIZE }, read).then((page) => page.items),
    // So do consultations.
    getLegacyConsultations({ limit: PAGE_SIZE }, read).then((page) => page.items),
    // Bundles (حزم ماستري) are catalog products, keyed by slug.
    getCatalogProducts({ product_type: "bundle", limit: PAGE_SIZE }, read).then((page) => page.items),
    // The API lists only experts with something to offer.
    getLegacyExperts({ limit: PAGE_SIZE }, read).then((page) => page.items),
    getSearchOptions({ limit: 500 }, read),
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

  // `/legacy/courses` lists diplomas too; each item goes under the route its kind lives at.
  const products = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const dto of [...(valueOf(courses, "sitemap courses") ?? []), ...(valueOf(diplomas, "sitemap diplomas") ?? [])]) {
    if (!isPublishable(dto)) continue;
    const path = dto.is_diploma ? routes.diploma(dto.id, dto.link_name) : routes.course(dto.id, dto.link_name);
    const url = `${siteUrl}${path}`;
    products.set(url, { url, changeFrequency: "weekly", priority: dto.is_diploma ? 0.8 : 0.7 });
  }
  for (const dto of valueOf(packages, "sitemap packages") ?? []) {
    if (!isPublishable(dto)) continue;
    const url = `${siteUrl}${routes.package(dto.id)}`;
    products.set(url, { url, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const dto of valueOf(consultations, "sitemap consultations") ?? []) {
    if (!isPublishable(dto)) continue;
    const url = `${siteUrl}${routes.consultation(dto.id)}`;
    products.set(url, { url, changeFrequency: "weekly", priority: 0.6 });
  }
  for (const dto of valueOf(bundles, "sitemap bundles") ?? []) {
    if (!isPublishedBundle(dto)) continue;
    const url = `${siteUrl}${routes.bundle(dto.slug)}`;
    products.set(url, { url, changeFrequency: "weekly", priority: 0.8 });
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
    ...(await getLiveTrainingSlugs()).map((slug): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}${routes.liveTraining(slug)}`,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
