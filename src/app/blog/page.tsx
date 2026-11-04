import type { Metadata } from "next";
import { connection } from "next/server";

import { blogListMetadata, loadBlogListPage, parseBlogListState } from "@/features/blog/api/load-blog-page";
import { BlogListPage } from "@/features/blog/blog-list-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  return blogListMetadata(await searchParams);
}

export default async function BlogIndexRoute({ searchParams }: PageProps<"/blog">) {
  await connection();
  const state = parseBlogListState(await searchParams);
  const data = await loadBlogListPage(state);
  return <BlogListPage data={data} />;
}
