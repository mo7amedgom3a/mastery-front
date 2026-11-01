"use client";

import { useEffect } from "react";

/**
 * Reveals `[data-reveal]` elements as they enter the viewport (the CSS hides them only while
 * `html.js` is set, and only when the visitor allows motion). A MutationObserver picks up article
 * blocks that arrive later — the Studio preview replaces the whole post on every render message.
 */
export function RevealObserver() {
  useEffect(() => {
    const observed = new WeakSet<Element>();
    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("in");
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );
    }

    const scan = () => {
      const elements = document.querySelectorAll<HTMLElement>(".blog-theme [data-reveal]:not(.in)");
      for (const element of elements) {
        if (observed.has(element)) continue;
        observed.add(element);
        if (observer) observer.observe(element);
        else element.classList.add("in");
      }
    };

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer?.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
