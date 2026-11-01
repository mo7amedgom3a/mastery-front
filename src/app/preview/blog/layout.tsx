import type { ReactNode } from "react";

import { BlogTheme } from "@/features/blog/components/blog-theme";

import "@/features/blog/styles/blog.css";

/** The preview lives outside /blog, so it carries the same theme wrapper and fonts. */
export default function BlogPreviewLayout({ children }: { children: ReactNode }) {
  return <BlogTheme>{children}</BlogTheme>;
}
