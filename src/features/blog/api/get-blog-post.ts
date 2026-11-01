import "server-only";

import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api/client";
import { cachedRead } from "@/lib/api/server-cache";

import type { BlogPostDetail } from "../model/types";
import { BLOG_REVALIDATE_SECONDS } from "./get-blog-posts";

/** A published post with its document and related posts; null when there is no such post. */
export const getBlogPost = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  try {
    return await apiFetch<BlogPostDetail>("/blog/posts/{slug}", {
      path: { slug },
      ...cachedRead(BLOG_REVALIDATE_SECONDS, ["blog", `blog-post-${slug}`]),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

/**
 * The draft being edited in the Blog Studio, including unpublished posts. Server-side only: the
 * shared secret must never reach the browser. Uncached so a save shows on the next reload.
 */
export const getBlogPostPreview = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  try {
    return await apiFetch<BlogPostDetail>("/blog/posts/{slug}/preview", {
      path: { slug },
      headers: { "x-preview-secret": process.env.REVALIDATE_SECRET ?? "" },
      cache: "no-store",
      context: { requestId: null },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
