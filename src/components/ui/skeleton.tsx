import { clsx as cn } from "clsx";
import LoadingSkeleton from "react-loading-skeleton";

/**
 * Shimmering placeholder block (react-loading-skeleton, themed in globals.css). Size it with
 * utilities (`h-5 w-3/4`, `aspect-[16/10]`). Decorative: the surrounding region carries
 * `role="status"` and the screen-reader text.
 */
export function Skeleton({ className }: { className?: string }) {
  // `inline` drops the library's trailing <br>, and the wrapper is taken out of layout, so the
  // block is a direct flex/grid child of wherever it is placed.
  return <LoadingSkeleton inline direction="rtl" containerClassName="contents" className={cn("block", className)} />;
}

/** Placeholder with a product card's footprint: cover, title, then `lines - 1` meta lines. */
export function CardSkeleton({ lines = 2 }: { lines?: 2 | 3 }) {
  return (
    <>
      <Skeleton className="aspect-[16/10]" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        {lines === 3 ? <Skeleton className="h-4" /> : null}
        <Skeleton className="h-4 w-1/2" />
      </div>
    </>
  );
}
