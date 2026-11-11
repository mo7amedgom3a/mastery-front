import type { Metadata } from "next";

import { blogPostMetadata, loadBlogPostPage } from "@/features/blog/api/load-blog-page";
import { BlogPostPage } from "@/features/blog/blog-post-page";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMetadata(slug);
}

export default async function BlogPostRoute({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await loadBlogPostPage(slug);
  return <BlogPostPage post={post} />;
}
