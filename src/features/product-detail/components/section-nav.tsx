"use client";

import { clsx as cn } from "clsx";
import { useEffect, useState } from "react";

export type SectionNavItem = { id: string; label: string };

/**
 * Kit `.ma-tabs`-style in-page nav, sticky under the site header. Plain anchor links (they work
 * without JS); the observer only moves the underline to the section being read.
 */
export function SectionNav({ items }: { items: readonly SectionNavItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = items.map((item) => document.getElementById(item.id)).filter((node) => node !== null);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
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

  if (items.length < 2) {
    return null;
  }

  return (
    <nav
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
