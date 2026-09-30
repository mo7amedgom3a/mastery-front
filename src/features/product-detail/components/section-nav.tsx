"use client";

import { clsx as cn } from "clsx";
import { useEffect, useRef, useState, type MouseEvent } from "react";

export type SectionNavItem = { id: string; label: string };

type Gsap = typeof import("gsap").gsap;
let gsapPromise: Promise<Gsap> | null = null;
/** GSAP and its scroll plugin are loaded on demand (once the nav mounts), never in the initial bundle. */
function loadGsap(): Promise<Gsap> {
  gsapPromise ??= Promise.all([import("gsap"), import("gsap/ScrollToPlugin")]).then(([{ gsap }, { ScrollToPlugin }]) => {
    gsap.registerPlugin(ScrollToPlugin);
    return gsap;
  });
  return gsapPromise;
}

/**
 * Kit `.ma-tabs`-style in-page nav, sticky under the site header. The links are plain anchors (they
 * work without JS); with JS a click glides to the section with GSAP instead of jumping, and the
 * observer moves the underline to the section being read. Under reduced motion the jump is kept.
 */
export function SectionNav({ items }: { items: readonly SectionNavItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  // While a click's scroll is running, the sections passing by must not steal the underline.
  const gliding = useRef(false);
  const tween = useRef<ReturnType<Gsap["to"]> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodes = items.map((item) => document.getElementById(item.id)).filter((node) => node !== null);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (gliding.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActive(top.target.id);
        }
      },
      // A band just under the sticky header and this nav: the section crossing it is "current".
      { rootMargin: "-140px 0px -60% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    void loadGsap();
    return () => {
      tween.current?.kill();
    };
  }, []);

  const glideTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    // New-tab and other modified clicks keep their browser behaviour.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(id);
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    // What the anchor would have done: the section is linkable and Back returns to the old position.
    window.history.pushState(null, "", `#${id}`);
    setActive(id);
    gliding.current = true;
    const release = () => {
      gliding.current = false;
    };

    // Where the section's top should rest: its own `scroll-mt` (which clears the header and this
    // nav), or just under this nav for sections that don't set one.
    const nav = navRef.current;
    const underNav = nav ? parseFloat(getComputedStyle(nav).top) + nav.offsetHeight + 16 : 0;
    const offsetY = parseFloat(getComputedStyle(target).scrollMarginTop) || underNav;

    void loadGsap().then((gsap) => {
      tween.current?.kill();
      tween.current = gsap.to(window, {
        duration: 0.9,
        ease: "power3.inOut",
        // The visitor scrolling by hand takes over.
        scrollTo: { y: target, offsetY, autoKill: true, onAutoKill: release },
        onComplete: () => {
          // Sections rendered lazily on the way (`cv-auto`) can move the target: settle on it.
          window.scrollBy(0, target.getBoundingClientRect().top - offsetY);
          release();
        },
      });
    });
  };

  if (items.length < 2) {
    return null;
  }

  return (
    <nav
      ref={navRef}
      aria-label="أقسام الصفحة"
      className="sticky top-[var(--header-h)] z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85"
    >
      <div className="ma-container">
        <ul className="m-0 -mx-4 flex list-none gap-6 overflow-x-auto p-0 px-4 sm:mx-0 sm:px-0">
          {items.map((item) => {
            const current = active === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  onClick={(event) => glideTo(event, item.id)}
                  aria-current={current ? "location" : undefined}
                  className={cn(
                    "inline-flex min-h-14 items-center border-b-[3px] text-[15px] font-medium no-underline transition-colors",
                    current ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
