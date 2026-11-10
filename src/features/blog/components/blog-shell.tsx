"use client";

import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { BlogFooter } from "./blog-footer";
import { BlogHeader } from "./blog-header";
import { ProgressBar } from "./progress-bar";

const HEADER_OFFSET = "top 84px";

/** The article pages show the reading-progress line; indexes and the unsubscribe page do not. */
function showsProgress(pathname: string): boolean {
  return !(
    pathname === "/blog" ||
    pathname === "/blog/unsubscribe" ||
    pathname.startsWith("/blog/authors")
  );
}

/**
 * The blog's smooth-scroll shell.
 *
 * GSAP's ScrollSmoother owns the scroll for the page content (`#blog-smooth-wrapper`), giving the
 * blog inertial smoothing, while the header stays outside the transformed content so its sticky
 * behaviour is untouched. Anchors inside the blog (`#articles`, `#subscribe`, the TOC, the
 * categories pills) are intercepted and animated with the smoother instead of jumping; hashes that
 * arrive with a navigation (e.g. a post's «اشترك» → `/blog#subscribe`) are animated once the new
 * page has rendered.
 *
 * Visitors who prefer reduced motion get the shell structure with plain native scrolling (no
 * smoother, no interception), so nothing here is required for the page to work.
 */
export function BlogShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !wrapperRef.current || !contentRef.current) return;

    gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
    ScrollSmoother.get()?.kill();
    if (window.history.scrollRestoration) window.history.scrollRestoration = "manual";

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.15,
      smoothTouch: 0.1,
      effects: false,
      normalizeScroll: false,
    });

    const scroller = smoother as unknown as {
      scrollTo: (target: Element | string | number, smooth?: boolean, position?: string) => void;
      paused: (value: boolean) => void;
    };

    // Same-page anchor clicks animate instead of jumping. Capture phase is deliberate: Next's
    // <Link> handler (bubble, on the React root) skips navigation when the click is already
    // default-prevented, so intercepting first is what stops the router from swallowing the hash.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Leaving the page: drop the smoother to the top *before* the router swaps the content. Doing
      // it afterwards races ScrollSmoother's resize refresh, which restores (and clamps) the old
      // offset — the new page would open scrolled to its end.
      if (url.pathname !== window.location.pathname) {
        scroller.scrollTo(0, false);
        return;
      }
      if (!url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      scroller.scrollTo(target, true, HEADER_OFFSET);
      window.history.pushState(null, "", url.hash);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      smoother.kill();
    };
  }, []);

  // Client-side navigation: start the new page at the top immediately (otherwise the smoother would
  // visibly ease from the previous page's scroll offset), or animate to the hash it carries
  // (post → /blog#subscribe) once the new page has rendered.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const smoother = ScrollSmoother.get() as unknown as {
      scrollTo: (t: Element | number, s?: boolean, p?: string) => void;
    } | null;
    if (!smoother) return;

    const hash = window.location.hash;
    if (!hash) {
      // Back/forward and programmatic pushes: reset now and once more after the content resize
      // refresh, so the smoother cannot restore the previous page's offset.
      smoother.scrollTo(0, false);
      const frame = requestAnimationFrame(() => smoother.scrollTo(0, false));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) smoother.scrollTo(target, true, HEADER_OFFSET);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className="blog-fixed-header">
        <BlogHeader />
      </div>
      <div id="blog-smooth-wrapper" ref={wrapperRef}>
        <div id="blog-smooth-content" ref={contentRef}>
          {children}
          <BlogFooter />
        </div>
      </div>
      {showsProgress(pathname) ? <ProgressBar /> : null}
    </>
  );
}
