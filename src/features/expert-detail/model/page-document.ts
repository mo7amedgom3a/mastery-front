import type { Route } from "next";

import type { BrandColor } from "@/components/ui/brand-colors";
import type { StudioBlock } from "@/features/product-detail/model/studio-content";
import type { CatalogCard } from "@/lib/api/browse";
import { productHref } from "@/lib/catalog/product-href";
import { cleanText, toPlainText } from "@/lib/format";
import { toPricing, type Pricing } from "@/lib/pricing";

/*
 * The expert page built in the admin's expert Studio: BlockNote blocks, rendered like a course's Studio page.
 * Its `programCards` blocks name products by slug (`items`); before rendering, each block gets the cards it
 * shows resolved from the expert's own items (`cards`), so the renderer needs no data of its own.
 */

/** A product in a `programCards` block. */
export type ProgramCardVM = {
  slug: string;
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  tag: string;
  color: BrandColor;
  price: Pricing;
};

const KIND: Record<string, { tag: string; color: BrandColor }> = {
  course: { tag: "دورة", color: "coral" },
  diploma: { tag: "دبلوم", color: "yellow" },
  package: { tag: "باقة", color: "green" },
  consultation: { tag: "استشارة", color: "lilac" },
  bundle: { tag: "حزمة", color: "teal" },
  live_diploma: { tag: "برنامج مباشر", color: "sky" },
};

/** The expert's own items by slug, as program cards. */
export function programCardIndex(cards: readonly CatalogCard[]): Map<string, ProgramCardVM> {
  const index = new Map<string, ProgramCardVM>();
  for (const card of cards) {
    const title = cleanText(card.title) ?? card.slug;
    const href = productHref(card, title);
    const kind = KIND[card.product_type] ?? KIND.course;
    if (!href) continue;
    index.set(card.slug, {
      slug: card.slug,
      title,
      summary: toPlainText(card.short_description, 140),
      image: card.image ?? null,
      href,
      tag: kind.tag,
      color: kind.color,
      price: toPricing(card.price?.amount, card.price?.compare_at_amount),
    });
  }
  return index;
}

function slugsOf(items: unknown): string[] {
  if (typeof items !== "string" || !items) return [];
  try {
    const parsed = JSON.parse(items) as unknown;
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => (typeof (item as { slug?: unknown })?.slug === "string" ? [(item as { slug: string }).slug] : []))
      : [];
  } catch {
    return [];
  }
}

/** The blocks with each `programCards` block's cards resolved (unknown or unpublished slugs are left out). */
export function resolveProgramCards(blocks: readonly StudioBlock[], index: ReadonlyMap<string, ProgramCardVM>): StudioBlock[] {
  return blocks.map((block) => {
    const children = block.children?.length ? resolveProgramCards(block.children, index) : block.children;
    if (block.type !== "programCards") return children === block.children ? block : { ...block, children };
    const cards = slugsOf(block.props?.items).flatMap((slug) => {
      const card = index.get(slug);
      return card ? [card] : [];
    });
    return { ...block, children, props: { ...block.props, cards: JSON.stringify(cards) } };
  });
}

/** The resolved cards of a `programCards` block (see `resolveProgramCards`); only site-relative links survive. */
export function programCardsOf(value: unknown): ProgramCardVM[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? (parsed as ProgramCardVM[]).filter((card) => typeof card?.href === "string" && card.href.startsWith("/") && !card.href.startsWith("//"))
      : [];
  } catch {
    return [];
  }
}
