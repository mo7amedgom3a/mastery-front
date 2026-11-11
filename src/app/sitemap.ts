import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { terms } from "@/features/legal/content/terms";
import { privacy } from "@/features/legal/content/privacy";
import { getAllBlogPosts } from "@/features/blog/api/get-blog-posts";
import { authorProfiles } from "@/features/blog/data/author-profiles";
import { getLiveTrainingSlugs } from "@/features/live-training/api/get-live-trainings";
import { emptySearchState, PRODUCT_TYPES, searchHref } from "@/features/search/model/params";
import { getAllCatalogCards, getCatalogExperts, parseCardSlug } from "@/lib/api/browse";
import { getSearchOptions } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

// Incremental static regeneration: prerendered at build, then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 3600;

const read = cachedRead(revalidate, ["sitemap"]);

type SitemapEntry = MetadataRoute.Sitemap[number];

/** A valid Date or null; API dates are occasionally empty or malformed. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The newest of the given dates, or null when none is usable. */
function latest(...values: (string | Date | null | undefined)[]): Date | null {
  let newest: Date | null = null;
  for (const value of values) {
    const date = toDate(value);
    if (date && (!newest || date > newest)) newest = date;
  }
  return newest;
}

/** Arabic-only site: each canonical URL is its own `ar`/`x-default` target. */
function languages(url: string) {
  return { languages: { ar: url, "x-default": url } };
}

function absoluteImage(value: unknown): string | null {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

// Cards carry the product's `updated_at`, used as `lastModified`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const productCards = valueOf(cards, "sitemap products") ?? [];
  const posts = valueOf(blogPosts, "sitemap blog") ?? [];
  const contentUpdated = latest(
    ...productCards.map((card) => card.updated_at),
    ...posts.map((post) => post.published_at),
  );

  // The listings: the search page as a whole, per product type and per category that has products.
  // Same URLs as the pages' canonicals (`searchHref`); finer filter combinations are noindexed.
  const entry = (
    path: string,
    options: {
      changeFrequency: SitemapEntry["changeFrequency"];
      priority: number;
      lastModified?: Date | null;
      images?: string[];
    },
  ): SitemapEntry => {
    const url = `${siteUrl}${path}`;
    return {
      url,
      changeFrequency: options.changeFrequency,
      priority: options.priority,
      alternates: languages(url),
      ...(options.lastModified ? { lastModified: options.lastModified } : {}),
      ...(options.images && options.images.length > 0 ? { images: options.images } : {}),
    };
  };
  const listing = (path: string, priority: number): SitemapEntry =>
    entry(path, { changeFrequency: "daily", priority, lastModified: contentUpdated });
  const page = (path: string, priority: number, lastModified?: Date | null): SitemapEntry =>
    entry(path, { changeFrequency: "monthly", priority, lastModified });

  const listings = [
    listing(searchHref(emptySearchState), 0.9),
    entry(routes.live, { changeFrequency: "daily", priority: 0.8 }),
    entry(routes.experts, { changeFrequency: "daily", priority: 0.8 }),
    page(routes.business, 0.8),
    page(routes.businessB2b, 0.7),
    entry(routes.blog, { changeFrequency: "weekly", priority: 0.8, lastModified: latest(...posts.map((post) => post.published_at)) }),
    page(routes.trainers, 0.7),
    page(routes.subscriptions, 0.8),
    page(routes.marketers, 0.6),
    page(routes.verify, 0.5),
    page(routes.terms, 0.3, toDate(terms.updated)),
    page(routes.privacy, 0.3, toDate(privacy.updated)),
    ...PRODUCT_TYPES.map((type) => listing(searchHref({ ...emptySearchState, types: [type] }), 0.9)),
    ...(valueOf(searchOptions, "sitemap search options")?.categories ?? [])
      .filter((category) => category.count > 0)
      .map((category) => listing(searchHref({ ...emptySearchState, categories: [category.code.toLowerCase()] }), 0.7)),
  ];

  const products = new Map<string, SitemapEntry>();
  for (const card of productCards) {
    const parsed = parseCardSlug(card.slug);
    let path: string | null = null;
    let priority = 0.7;
    if (parsed?.kind === "course") {
      path = routes.course(parsed.id);
    } else if (parsed?.kind === "diploma") {
      path = routes.diploma(parsed.id);
      priority = 0.8;
    } else if (parsed?.kind === "package") {
      path = routes.package(parsed.id);
      priority = 0.8;
    } else if (parsed?.kind === "consultation") {
      path = routes.consultation(parsed.id);
      priority = 0.6;
    } else if (card.product_type === "bundle") {
      path = routes.bundle(card.slug);
      priority = 0.8;
    }
    if (!path) continue;
    const url = `${siteUrl}${path}`;
    const image = absoluteImage((card as { image?: unknown }).image);
    products.set(url, {
      url,
      // Only the product's own update time: no fabricated "today" timestamps.
      ...(toDate(card.updated_at) ? { lastModified: toDate(card.updated_at) as Date } : {}),
      changeFrequency: "weekly",
      priority,
      alternates: languages(url),
      // Public product artwork is stable. Blog covers are presigned redirects, so they are skipped.
      ...(image ? { images: [image] } : {}),
    });
  }
  for (const dto of valueOf(experts, "sitemap experts") ?? []) {
    const name = dto.name?.trim();
    if (!name) continue;
    const url = `${siteUrl}${routes.expert(dto.key, name)}`;
    products.set(url, { url, changeFrequency: "weekly", priority: 0.5, alternates: languages(url) });
  }

  return [
    {
      url: home,
      // The landing page reflects the newest product/article; never a per-request `new Date()`.
      ...(contentUpdated ? { lastModified: contentUpdated } : {}),
      changeFrequency: "daily",
      priority: 1,
      alternates: languages(home),
    },
    ...listings,
    ...products.values(),
    ...(valueOf(liveSlugs, "sitemap live trainings") ?? []).map((slug) => {
      const url = `${siteUrl}${routes.liveTraining(slug)}`;
      return {
        url,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: languages(url),
      };
    }),
    ...posts.map((post) => {
      const url = `${siteUrl}${routes.blogPost(post.slug)}`;
      const updated = toDate(post.published_at);
      return {
        url,
        ...(updated ? { lastModified: updated } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: languages(url),
      };
    }),
    entry(routes.blogAuthors, { changeFrequency: "monthly", priority: 0.7 }),
    ...authorProfiles.map((profile) =>
      entry(routes.blogAuthor(profile.slug), { changeFrequency: "monthly", priority: 0.7 }),
    ),
  ];
}
