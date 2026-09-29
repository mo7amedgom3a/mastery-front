"use client";

import { useEffect, useRef } from "react";

import { formatNumber } from "@/lib/format";

type CountUpProps = {
  value: number;
  prefix?: string;
  /** Milliseconds for the full count. */
  duration?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 * - The server HTML carries the real number (crawlers, no-JS, screen readers via the sr-only copy).
 * - Writes straight to the text node inside rAF: no React re-render per frame.
 * - Width is reserved with `ch` + tabular digits, so counting never shifts layout.
 * - Reduced motion: shows the final number, no animation.
 */
export function CountUp({ value, prefix = "", duration = 1600, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = `${prefix}${formatNumber(value)}`;

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const render = (n: number) => {
      node.textContent = `${prefix}${formatNumber(n)}`;
    };
    render(0);

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          render(Math.round(value * easeOutCubic(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      render(value);
    };
  }, [value, prefix, duration]);

  return (
    <>
      <span
        ref={ref}
        aria-hidden="true"
        dir="ltr"
        className={className}
        style={{ display: "inline-block", minWidth: `${final.length}ch`, fontVariantNumeric: "tabular-nums" }}
      >
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </>
  );
}
