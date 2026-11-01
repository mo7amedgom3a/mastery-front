import "server-only";

import { apiFetch } from "@/lib/api/client";
import { cachedRead } from "@/lib/api/server-cache";

import type { BlogCategory } from "../model/types";
import { BLOG_REVALIDATE_SECONDS } from "./get-blog-posts";

/** Categories with their published-post counts, ordered for the filter pills. */
export function getBlogCategories(): Promise<BlogCategory[]> {
  return apiFetch<BlogCategory[]>("/blog/categories", cachedRead(BLOG_REVALIDATE_SECONDS, ["blog", "blog-categories"]));
}
