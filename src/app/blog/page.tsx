import type { Metadata } from "next";

import { blogListMetadata, loadBlogListPage, parseBlogListState } from "@/features/blog/api/load-blog-page";
import { BlogListPage } from "@/features/blog/blog-list-page";

// ISR: the index is rebuilt at most every 5 minutes, or at once via POST /api/revalidate?tag=blog.
export const revalidate = 300;

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  return blogListMetadata(await searchParams);
}

export default async function BlogIndexRoute({ searchParams }: PageProps<"/blog">) {
  const state = parseBlogListState(await searchParams);
  const data = await loadBlogListPage(state);
  return <BlogListPage data={data} />;
}
