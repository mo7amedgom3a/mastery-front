import type { ReactNode } from "react";

import { BlogThemeSync } from "./blog-theme-sync";

const themeScript = `(function(){var d=document;d.documentElement.classList.add("js");try{var t=localStorage.getItem("ma-blog-theme");if(t==="dark"){var s=d.currentScript;var r=s&&s.parentElement;if(r)r.setAttribute("data-blog-theme","dark")}}catch(e){}})();`;

/**
 * The blog's own shell: every blog page lives inside this wrapper, which carries the sub-brand's
 * tokens and theme. The tiny script reads the saved choice before first paint; the server always
 * renders the paper theme, so the attribute change is the one thing hydration is told to ignore.
 */
export function BlogTheme({ children }: { children: ReactNode }) {
  return (
    <div className="blog-theme" data-blog-theme="light" suppressHydrationWarning>
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
      <BlogThemeSync />
    </div>
  );
}
