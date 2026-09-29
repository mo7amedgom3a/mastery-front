import type { Route } from "next";
import type { ReactNode } from "react";

import { CardCarousel } from "@/components/motion/card-carousel";
import { ProductCard, type ProductCardProps } from "@/components/ui/product-card";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ViewAllLink } from "@/components/ui/view-all-link";

type ProductRailSectionProps = {
  /** Section anchor, e.g. a `LandingSectionId` on the landing page. */
  id: string;
  label: string;
  title: string;
  lead?: ReactNode;
  viewAll?: { label: string; href: Route };
  tone?: "base" | "alt";
  cards: (ProductCardProps & { key: string | number })[];
  /** Extra content between header and carousel (e.g. filter chips). */
  children?: ReactNode;
  /** Changing it remounts the carousel, so a new filter starts at its first card. */
  railKey?: string;
};

/** Section header + card carousel. Renders nothing without cards. */
export function ProductRailSection({
  id,
  label,
  title,
  lead,
  viewAll,
  tone,
  cards,
  children,
  railKey,
}: ProductRailSectionProps) {
  if (cards.length === 0) {
    return null;
  }
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} tone={tone} deferRender>
      <SectionHeader
        id={titleId}
        label={label}
        title={title}
        lead={lead}
        action={
          viewAll ? <ViewAllLink href={viewAll.href} label={viewAll.label} /> : null
        }
      />
      {children}
      <CardCarousel key={railKey} label={title} className="reveal mt-12">
        {cards.map(({ key, ...card }) => (
          <ProductCard key={key} {...card} />
        ))}
      </CardCarousel>
    </Section>
  );
}
