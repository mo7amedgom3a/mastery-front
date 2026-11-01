import type { Metadata } from "next";

import { BlogPostPage } from "@/features/blog/blog-post-page";
import { loadBlogPreviewPage } from "@/features/blog/api/load-blog-page";
import { BlogPreviewReceiver } from "@/features/blog/components/blog-preview-receiver";

export const metadata: Metadata = {
  title: "معاينة مقال",
  robots: { index: false, follow: false },
};

function slugOf(value: string | string[] | undefined): string {
  const slug = Array.isArray(value) ? value[0] : value;
  return slug?.trim() || "";
}

/**
 * The Blog Studio's preview. `?slug=` is the open-in-tab mode: the draft is fetched server-side
 * with the shared secret and rendered with no header/footer. No slug means the Studio frames this
 * page and drives it with `{source:"mastery-studio", type:"render", kind:"blog-post", base, document}`
 * messages; the receiver announces `ready` and renders each payload in the browser.
 */
export default async function BlogPreviewRoute({ searchParams }: PageProps<"/preview/blog">) {
  const params = await searchParams;
  const slug = slugOf(params.slug);
  if (!slug) {
    return <BlogPreviewReceiver />;
  }
  const post = await loadBlogPreviewPage(slug);
  return <BlogPostPage post={post} preview />;
}
