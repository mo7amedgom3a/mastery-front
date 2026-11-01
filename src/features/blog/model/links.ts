import type { Route } from "next";

import { routes } from "@/config/routes";

export type BlogListQuery = {
  page?: number;
  category?: string | null;
};

/** The blog index at one page, optionally filtered by a category slug. */
export function blogListHref({ page = 1, category }: BlogListQuery = {}): Route {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return (query ? `${routes.blog}?${query}` : routes.blog) as Route;
}

export function blogCategoryHref(slug: string): Route {
  return blogListHref({ category: slug });
}

/** `/blog#categories`, `/blog#subscribe`, `/blog#about`: anchors that also work from a post page. */
export function blogAnchor(anchor: "categories" | "subscribe" | "about"): Route {
  return `${routes.blog}#${anchor}` as Route;
}
