import type { Route } from "next";
import type { ReactNode } from "react";

import { ProductCard, type ProductCardProps } from "@/components/ui/product-card";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ViewAllLink } from "@/components/ui/view-all-link";
import type { LandingSectionId } from "@/config/routes";

type ProductRailSectionProps = {
  id: LandingSectionId;
  label: string;
  title: string;
  lead?: ReactNode;
  viewAll?: { label: string; href: Route };
  tone?: "base" | "alt";
  cards: (ProductCardProps & { key: string | number })[];
  /** Extra content between header and rail (e.g. filter chips). */
  children?: ReactNode;
  /** Changing it remounts the rail, so a new filter starts scrolled to its first card. */
  railKey?: string;
};

/** Section header + horizontally scrolling card rail. Renders nothing without cards. */
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
      <ul key={railKey} className="rail rail--4 reveal m-0 mt-12 list-none p-0" aria-label={title}>
        {cards.map(({ key, ...card }) => (
          <li key={key}>
            <ProductCard {...card} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
