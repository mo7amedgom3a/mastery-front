import type { ReactNode } from "react";

/**
 * Side column of a detail page (from `lg`): its card sticks under the site header and the section
 * nav. The card is capped to the space left in the viewport, so on a short screen or under browser
 * zoom it scrolls inside the column instead of running off the bottom of the screen.
 */
export function StickySidebar({ children }: { children: ReactNode }) {
  return (
    <div className="hidden lg:block">
      {/* 4.5rem: the section nav (3.5rem) plus a gap. The extra 1rem in max-h keeps air at the bottom. */}
      <div className="sticky top-[calc(var(--header-h)+4.5rem)] max-h-[calc(100dvh-var(--header-h)-5.5rem)] overflow-y-auto [scrollbar-width:thin]">
        {children}
      </div>
    </div>
  );
}
