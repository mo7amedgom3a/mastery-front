import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

type MarqueeProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Seconds for one track to scroll past. Longer = slower. */
  duration?: number;
  reverse?: boolean;
  /**
   * How many copies of the list sit side by side. Tracks hug their content, so for a seamless
   * loop the copies together must be at least one track wider than the viewport — raise this
   * for short lists.
   */
  repeat?: number;
  /** Pause while hovered or focused (default). Turn off for decorative tickers. */
  pauseOnHover?: boolean;
  /** Accessible name for the list. */
  label: string;
  className?: string;
  itemClassName?: string;
};

/**
 * Infinite horizontal marquee, pure CSS (see `.marquee` in globals.css). Server-rendered: the
 * first track is the real, readable list; the copies are visual duplicates marked `aria-hidden`
 * and `inert`, so they never reach the accessibility tree or the tab order.
 */
export function Marquee<T>({
  items,
  getKey,
  renderItem,
  duration = 40,
  reverse,
  repeat = 2,
  pauseOnHover = true,
  label,
  className,
  itemClassName,
}: MarqueeProps<T>) {
  if (items.length === 0) {
    return null;
  }

  const style = { "--marquee-duration": `${duration}s` } as CSSProperties;
  const copies = Math.max(2, repeat);

  return (
    <div
      className={cn("marquee", reverse && "marquee--reverse", pauseOnHover && "marquee--pause-hover", className)}
      style={style}
    >
      {Array.from({ length: copies }, (_, copy) => {
        const hidden = copy > 0;
        return (
          <ul
            key={copy}
            className="marquee__track"
            aria-label={hidden ? undefined : label}
            aria-hidden={hidden || undefined}
            inert={hidden}
          >
            {items.map((item) => (
              <li key={getKey(item)} className={cn("shrink-0", itemClassName)}>
                {renderItem(item)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
