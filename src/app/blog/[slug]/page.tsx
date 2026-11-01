import type { Metadata } from "next";

import { blogPostMetadata, loadBlogPostPage } from "@/features/blog/api/load-blog-page";
import { BlogPostPage } from "@/features/blog/blog-post-page";

// ISR: each post is built on its first visit, then refreshed every 5 minutes or on demand via
// POST /api/revalidate?tag=blog-post-{slug}.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
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
