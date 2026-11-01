"use client";

import { useEffect } from "react";

/**
 * Re-applies the saved blog theme after client-side navigation. The inline script in `BlogTheme`
 * only runs on a full page load; React renders the layout on a client transition without executing
 * it, so this effect picks the stored choice up again.
 */
export function BlogThemeSync() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const root = document.querySelector<HTMLElement>(".blog-theme");
    if (!root) return;
    try {
      const saved = localStorage.getItem("ma-blog-theme");
      if (saved === "light" || saved === "dark") {
        root.setAttribute("data-blog-theme", saved);
      }
    } catch {
      // Storage can be blocked; the server-rendered paper theme is the fallback.
    }
  }, []);

  return null;
}
