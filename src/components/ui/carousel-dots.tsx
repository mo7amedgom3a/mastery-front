"use client";

import { clsx } from "clsx";

export type CarouselDot = {
  key: string;
  /** Announced as "عرض: <label>" for the slide this dot selects. */
  label: string;
};

type CarouselDotsProps = {
  items: readonly CarouselDot[];
  activeIndex: number;
  onChange: (index: number) => void;
  /** Accessible name for the group. */
  label: string;
  /** Above this count a dot row becomes a wall of targets; show "n / total" instead. */
  compactAfter?: number;
  className?: string;
};

/**
 * Slide dots shared by the live banner and the podcast carousel. The visual bar stays 8px, but each
 * button is 24×44 so it is a comfortable touch target (WCAG 2.5.8) even when a carousel has ten
 * dots; the active dot uses the semantic accent token, not the raw coral. Carousels with many
 * slides (the podcast has 30 episodes) switch to a compact counter instead of dozens of targets.
 */
export function CarouselDots({
  items,
  activeIndex,
  onChange,
  label,
  compactAfter = 12,
  className,
}: CarouselDotsProps) {
  if (items.length > compactAfter) {
    return (
      <div role="group" aria-label={label} className={clsx("flex min-h-11 items-center", className)}>
        <span aria-hidden="true" dir="ltr" className="text-sm font-semibold tabular-nums text-fg-muted">
          {activeIndex + 1} / {items.length}
        </span>
        <span className="sr-only">{`العرض ${activeIndex + 1} من ${items.length}`}</span>
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} className={clsx("flex flex-wrap items-center", className)}>
      {items.map((item, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(index)}
            aria-label={`عرض: ${item.label}`}
            aria-current={active}
            className="group grid min-h-11 min-w-6 place-items-center px-0.5"
          >
            <span
              aria-hidden="true"
              className={clsx(
                "block h-2 rounded-full transition-all motion-reduce:transition-none",
                active ? "w-8 bg-accent" : "w-2 bg-line-strong opacity-40 group-hover:opacity-70",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
