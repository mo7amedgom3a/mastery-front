import { ProductCard } from "@/components/ui/product-card";
import type { RailCardVM } from "@/features/product-detail/model/types";
import { toCard } from "@/features/product-detail/sections/product-rails";

import type { ExpertFactKey } from "../model/facts";

export type ExpertServiceGroup = {
  /** Section anchor; the hero tiles and the section nav link here. */
  id: ExpertFactKey;
  title: string;
  /** Counted noun for the heading, e.g. "3 دورات". */
  count: string;
  cards: readonly RailCardVM[];
};

// Up to four cards a row inside the page container; never wider than a rail card on large screens.
const CARD_SIZES = "(min-width: 1200px) 390px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw";

/**
 * Everything the expert offers, one block per kind, every card linking to its own page. A grid
 * rather than a carousel: this is the body of the page, and nothing should hide behind a scroll.
 */
export function ExpertServices({ groups }: { groups: readonly ExpertServiceGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-title`}
          className="scroll-mt-[calc(var(--header-h)+4.5rem)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line-strong pb-4">
            <h2 id={`${group.id}-title`} className="m-0 text-2xl font-bold">
              {group.title}
            </h2>
            <span className="text-fg-muted">{group.count}</span>
          </div>
          <ul className="m-0 mt-8 grid list-none gap-6 p-0 sm:grid-cols-2 md:grid-cols-3">
            {group.cards.map((card) => {
              const { key, ...props } = toCard(card);
              return (
                <li key={key} className="min-w-0">
                  <ProductCard {...props} sizes={CARD_SIZES} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
