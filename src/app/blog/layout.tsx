import type { ReactNode } from "react";

import { BlogShell } from "@/features/blog/components/blog-shell";
import { BlogTheme } from "@/features/blog/components/blog-theme";

import "@/features/blog/styles/blog.css";

/** The public blog is its own sub-brand: one themed wrapper, no storefront chrome. */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <BlogTheme>
      <BlogShell>{children}</BlogShell>
    </BlogTheme>
  );
}
