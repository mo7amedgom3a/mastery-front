"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { routes } from "@/config/routes";

import { blogSubscribeHref } from "../model/links";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { label: "المقالات", href: routes.blog, match: "/blog", exclude: "/blog/authors" },
  { label: "الخبراء", href: routes.blogAuthors, match: "/blog/authors" },
] as const;

function isActive(item: (typeof NAV)[number], pathname: string): boolean {
  if ("exclude" in item && item.exclude && pathname.startsWith(item.exclude)) return false;
  return pathname.startsWith(item.match);
}

/** The blog's own header: a sub-brand of ماستري, not the storefront nav. */
export function BlogHeader() {
  const pathname = usePathname() ?? routes.blog;
  const subscribeHref = blogSubscribeHref(pathname);
  const [scrolled, setScrolled] = useState(false);
  // The drawer remembers which page it was opened on, so a navigation closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the drawer is open: Escape closes it and the page behind cannot scroll.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // A client-side navigation leaves the panel open otherwise, so every panel link closes it.
  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="wrap site-header-bar flex h-16 items-center justify-between gap-4">
        <Link href={routes.blog} className="brand-link" aria-label="ماستري أكاديمي — مدونة ماستري">
          {/* The company lockup, switching with the blog theme: ink word on paper, white on cinema. */}
          <Image
            src="/brand/ma-logo-coral-ink.svg"
            alt="ماستري أكاديمي"
            width={300}
            height={34}
            priority
            unoptimized
            className="blog-logo blog-logo-light"
          />
          <Image
            src="/brand/ma-logo-coral-white.svg"
            alt=""
            width={300}
            height={34}
            priority
            unoptimized
            aria-hidden="true"
            className="blog-logo blog-logo-dark"
          />
        </Link>

        <nav className="site-header-nav items-center gap-1" aria-label="التنقل الرئيسي">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="header-link"
              data-active={isActive(item, pathname) || undefined}
              aria-current={isActive(item, pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link href={subscribeHref} className="btn btn-accent btn-sm blog-header-subscribe">
            اشترك
          </Link>
          <button
            type="button"
            className="icon-btn blog-menu-toggle"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            aria-controls="blog-mobile-nav"
            onClick={() => setOpenPath((current) => (current === pathname ? null : pathname))}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="إغلاق القائمة"
          onClick={() => setOpenPath(null)}
        />
      ) : null}

      {open ? (
        <div id="blog-mobile-nav" className="mobile-nav-panel">
          <nav aria-label="التنقل في المدونة">
            <ul>
              {NAV.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="header-link" onClick={() => setOpenPath(null)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={subscribeHref}
            className="btn btn-accent mt-3 w-full"
            onClick={() => setOpenPath(null)}
          >
            اشترك في النشرة
          </Link>
        </div>
      ) : null}
    </header>
  );
}
