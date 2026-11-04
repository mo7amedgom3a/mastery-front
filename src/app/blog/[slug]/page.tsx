import type { Metadata } from "next";
import { connection } from "next/server";

import { blogPostMetadata, loadBlogPostPage } from "@/features/blog/api/load-blog-page";
import { BlogPostPage } from "@/features/blog/blog-post-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMetadata(slug);
}

export default async function BlogPostRoute({ params }: PageProps<"/blog/[slug]">) {
  await connection();
  const { slug } = await params;
  const post = await loadBlogPostPage(slug);
  return <BlogPostPage post={post} />;
}
