import type { Metadata } from "next";

import { listAuthorProfiles } from "@/features/blog/api/get-blog-author-page";
import { AuthorIndexPage } from "@/features/blog/author-index-page";
import { routes } from "@/config/routes";
import { baseOpenGraph, baseTwitter } from "@/config/site";

export const revalidate = 3600;

const TITLE = "الخبراء – مدونة ماستري";
const DESCRIPTION =
  "تعرّف على خبراء مدونة ماستري: ثابت حجازي وسهل مهدي — مسيرتهم، إنجازاتهم، ومقالاتهم في التسويق والقيادة وريادة الأعمال.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.blogAuthors, languages: { ar: routes.blogAuthors, "x-default": routes.blogAuthors } },
  openGraph: { ...baseOpenGraph, type: "website", url: routes.blogAuthors, title: TITLE, description: DESCRIPTION },
  twitter: { ...baseTwitter, title: TITLE, description: DESCRIPTION },
};

export default function BlogAuthorsRoute() {
  return <AuthorIndexPage profiles={listAuthorProfiles()} />;
}
