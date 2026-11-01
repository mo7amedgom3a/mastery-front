import "server-only";

import { apiFetch } from "@/lib/api/client";
import { cachedRead } from "@/lib/api/server-cache";

import type { BlogPostList, BlogPostListItem } from "../model/types";

/** Keep in sync with the `revalidate` of `/blog` and `/blog/[slug]`. */
export const BLOG_REVALIDATE_SECONDS = 300;
export const BLOG_PAGE_SIZE = 12;
const SITEMAP_PAGE_SIZE = 48;

export type BlogPostsQuery = {
  category?: string | null;
  author?: string | null;
  page?: number;
  pageSize?: number;
};

/** Published posts, newest first; `category` is a category slug and `author` an expert key. */
export function getBlogPosts(query: BlogPostsQuery = {}): Promise<BlogPostList> {
  return apiFetch<BlogPostList>("/blog/posts", {
    query: {
      category: query.category ?? undefined,
      author: query.author ?? undefined,
      page: query.page ?? 1,
      page_size: query.pageSize ?? BLOG_PAGE_SIZE,
    },
    ...cachedRead(BLOG_REVALIDATE_SECONDS, ["blog"]),
  });
}

/** Every published post, for the sitemap. Refreshed hourly with the catalog. */
export async function getAllBlogPosts(): Promise<BlogPostListItem[]> {
  const posts: BlogPostListItem[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const list = await apiFetch<BlogPostList>("/blog/posts", {
      query: { page, page_size: SITEMAP_PAGE_SIZE },
      ...cachedRead(3600, ["blog", "sitemap"]),
    });
    posts.push(...list.items);
    if (list.items.length === 0 || posts.length >= list.total) break;
  }
  return posts;
}
