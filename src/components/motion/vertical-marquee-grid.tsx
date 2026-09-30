import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

type VerticalMarqueeGridProps<T> = {
  /** One array per column; each column loops independently. */
  columns: readonly (readonly T[])[];
  getKey: (item: T) => string;
  renderItem: (item: T, column: number) => ReactNode;
  /** Base loop duration in seconds; columns are staggered around it. */
  duration?: number;
  className?: string;
};

// Staggered speeds keep neighbouring columns from moving in lockstep.
const SPEED_FACTORS = [1, 1.25, 0.9, 1.15, 1.05];

/**
 * Infinite vertical marquee grid (hero background). Adjacent columns scroll in opposite
 * directions; each column holds its list twice so a -50% loop is seamless. Pure CSS, decorative:
 * the whole grid is hidden from assistive tech. The top and bottom fade into `--surface-alt`; on
 * another backdrop set `--vmarquee-fade` to its colour.
 */
export function VerticalMarqueeGrid<T>({ columns, getKey, renderItem, duration = 60, className }: VerticalMarqueeGridProps<T>) {
  const gridStyle = { "--vmarquee-cols": columns.length } as CSSProperties;

  return (
    <div className={cn("vmarquee", className)} style={gridStyle} aria-hidden="true">
      {columns.map((column, columnIndex) => {
        const style = {
          "--vmarquee-duration": `${Math.round(duration * SPEED_FACTORS[columnIndex % SPEED_FACTORS.length])}s`,
        } as CSSProperties;
        const track = (duplicate: boolean) => (
          <ul className="vmarquee__track" aria-hidden={duplicate || undefined}>
            {column.map((item) => (
              <li key={getKey(item)}>{renderItem(item, columnIndex)}</li>
            ))}
          </ul>
        );
        return (
          <div
            key={columnIndex}
            className={cn("vmarquee__col", columnIndex % 2 === 1 && "vmarquee__col--down")}
            style={style}
          >
            {track(false)}
            {track(true)}
          </div>
        );
      })}
    </div>
  );
}
