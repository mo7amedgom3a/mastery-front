import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";
import { valueOf } from "@/lib/api/server-cache";

import { getBlogCategories } from "./get-blog-categories";
import { getBlogPost, getBlogPostPreview } from "./get-blog-post";
import { BLOG_PAGE_SIZE, getBlogPosts } from "./get-blog-posts";
import { listData, postVM } from "../model/mappers";
import type { BlogListData, BlogPostDetail, BlogPostVM } from "../model/types";

export const BLOG_DESCRIPTION =
  "مقالات من خبراء ماستري في التسويق الرقمي والقيادة وريادة الأعمال والتجارة الإلكترونية: أفكار عملية، وأدلة تطبيقية، وقراءات هادئة بلا ضجيج.";

type SearchParams = Record<string, string | string[] | undefined>;

export type BlogListState = { page: number; category: string | null };

function first(value: string | string[] | undefined): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.trim() || null;
}

/** Next hands dynamic segments back percent-encoded for non-ASCII slugs; the API wants the text. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseBlogListState(searchParams: SearchParams): BlogListState {
  const rawPage = Number.parseInt(first(searchParams.page) ?? "1", 10);
  return {
    category: first(searchParams.category),
    page: Number.isSafeInteger(rawPage) && rawPage > 1 ? rawPage : 1,
  };
}

/** The index at one page/category. Category failure only hides the filter pills. */
export async function loadBlogListPage(state: BlogListState): Promise<BlogListData> {
  const [postsResult, categoriesResult] = await Promise.allSettled([
    getBlogPosts({ category: state.category, page: state.page, pageSize: BLOG_PAGE_SIZE }),
    getBlogCategories(),
  ]);
  if (postsResult.status === "rejected") throw postsResult.reason;
  return listData(postsResult.value, valueOf(categoriesResult, "blog categories"), {
    page: state.page,
    category: state.category,
    pageSize: BLOG_PAGE_SIZE,
  });
}

/** The index's metadata; a filtered view names its category but keeps the one canonical URL. */
export async function blogListMetadata(searchParams: SearchParams): Promise<Metadata> {
  const state = parseBlogListState(searchParams);
  let categoryName: string | null = null;
  if (state.category) {
    const categories = await getBlogCategories().catch(() => []);
    categoryName = categories.find((category) => category.slug === state.category)?.name ?? null;
  }
  const title = categoryName ? `${categoryName} – المدونة` : "المدونة";
  return {
    title,
    description: BLOG_DESCRIPTION,
    alternates: { canonical: routes.blog, languages: { ar: routes.blog, "x-default": routes.blog } },
    openGraph: { ...baseOpenGraph, type: "website", url: routes.blog, title, description: BLOG_DESCRIPTION },
    twitter: { card: "summary_large_image", title, description: BLOG_DESCRIPTION },
    ...(state.page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export async function loadBlogPostPage(slug: string): Promise<BlogPostVM> {
  const post = await getBlogPost(safeDecode(slug));
  if (!post) notFound();
  return postVM(post);
}

function postMetadata(post: BlogPostDetail): Metadata {
  const url = routes.blogPost(post.slug);
  const title = post.seo_title?.trim() || post.title;
  const description =
    post.seo_description?.trim() || post.summary?.trim() || post.document.meta.summary?.trim() || siteConfig.description;
  const image = post.cover_image_url?.trim() || post.document.meta.cover?.url?.trim() || null;
  const imageAlt = post.cover_image_alt?.trim() || post.document.meta.cover?.alt?.trim() || post.title;
  const authors = post.author?.name ? [post.author.name] : undefined;
  const tags = post.tags.length > 0 ? post.tags : post.document.meta.tags;

  return {
    title,
    description,
    alternates: { canonical: url, languages: { ar: url, "x-default": url } },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      url,
      title,
      description,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(authors ? { authors } : {}),
      ...(tags.length > 0 ? { tags: [...tags] } : {}),
      ...(image ? { images: [{ url: image, alt: imageAlt }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(post.status === "published" ? {} : { robots: { index: false, follow: false } }),
  };
}

/** Metadata from the same cached request the page makes; unknown slugs get the 404 defaults. */
export async function blogPostMetadata(slug: string): Promise<Metadata> {
  const post = await getBlogPost(safeDecode(slug));
  return post ? postMetadata(post) : {};
}

/** A draft for the Studio preview (open-in-tab): behind the shared secret and never cached. */
export async function loadBlogPreviewPage(slug: string): Promise<BlogPostVM> {
  const post = await getBlogPostPreview(slug);
  if (!post) notFound();
  return postVM(post);
}
