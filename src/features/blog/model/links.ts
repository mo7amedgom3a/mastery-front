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

/**
 * The header's «اشترك» target: the newsletter box on the current page when it has one (the index and
 * a post), otherwise the box on the blog index. The author pages and the unsubscribe page have no
 * `#subscribe` section of their own.
 */
export function blogSubscribeHref(pathname: string): Route {
  const isAuthors = pathname === routes.blogAuthors || pathname.startsWith(`${routes.blogAuthors}/`);
  const isUnsubscribe = pathname === "/blog/unsubscribe";
  const hasSubscribeBox =
    !isAuthors && !isUnsubscribe && (pathname === routes.blog || pathname.startsWith(`${routes.blog}/`));
  return hasSubscribeBox ? (`${pathname}#subscribe` as Route) : blogAnchor("subscribe");
}
