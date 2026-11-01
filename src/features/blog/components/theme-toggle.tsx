"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type BlogThemeName = "light" | "dark";

const STORAGE_KEY = "ma-blog-theme";

/**
 * Switches the blog between «ورقي» (the paper light theme, default) and «سينما» (dark). The choice
 * is on the `.blog-theme` wrapper and persisted in localStorage, so only the blog changes.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  // null until mounted: the server always renders the light icon, and the saved theme is read after.
  const [theme, setTheme] = useState<BlogThemeName | null>(null);

  useEffect(() => {
    const root = buttonRef.current?.closest<HTMLElement>(".blog-theme");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked: fall back to what the wrapper already has.
    }
    // On a client-side navigation the shell's sync effect may not have run yet; storage is the truth.
    const dark = saved === "dark" || (saved === null && root?.getAttribute("data-blog-theme") === "dark");
    setTheme(dark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const root = buttonRef.current?.closest<HTMLElement>(".blog-theme");
    if (!root) return;
    const next: BlogThemeName = root.getAttribute("data-blog-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-blog-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still changes for this page.
    }
    setTheme(next);
  };

  const isDark = theme === "dark";
  const label =
    theme === null ? "تبديل المظهر" : isDark ? "التبديل إلى المظهر الورقي" : "التبديل إلى مظهر السينما";

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`icon-btn ${className}`.trim()}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
