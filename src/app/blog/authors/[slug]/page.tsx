import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadBlogAuthorPage } from "@/features/blog/api/get-blog-author-page";
import { AuthorProfilePage } from "@/features/blog/author-profile-page";
import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";

export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/blog/authors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadBlogAuthorPage(slug);
  if (!data) return {};
  const { profile } = data;
  const title = `${profile.name} — ${profile.title}`;
  const url = routes.blogAuthor(profile.slug);
  const image = profile.portrait.src;
  return {
    title,
    description: profile.tagline,
    alternates: { canonical: url, languages: { ar: url, "x-default": url } },
    openGraph: {
      ...baseOpenGraph,
      type: "profile",
      url,
      title,
      description: profile.tagline,
      images: [{ url: image, alt: profile.portrait.alt }],
    },
    twitter: { card: "summary_large_image", title, description: profile.tagline },
  };
}

export default async function BlogAuthorRoute({ params }: PageProps<"/blog/authors/[slug]">) {
  const { slug } = await params;
  const data = await loadBlogAuthorPage(slug);
  if (!data) notFound();
  return <AuthorProfilePage data={data} />;
}
