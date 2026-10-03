import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

import { TrackedCardLink } from "@/components/shop/tracked-card-link";
import { AppLink } from "@/components/ui/app-link";
import { brandBg, type BrandColor } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";
import type { Pricing } from "@/lib/pricing";

export type ProductCardMeta = {
  icon: LucideIcon;
  label: string;
  /** A person's photo (the instructor), shown as a small round avatar in place of the icon. */
  avatar?: string | null;
};

export type ProductCardTag = {
  label: string;
  href: Route;
};

export type ProductCardProps = {
  href: Route;
  title: string;
  image?: string | null;
  /** Colour field shown when there is no image, and behind transparent artwork. */
  color: BrandColor;
  tag?: string | null;
  summary?: string | null;
  /** Topic chips under the summary, each a link (e.g. to the search for that tag). */
  tags?: ProductCardTag[];
  meta?: ProductCardMeta[];
  price?: Pricing | null;
  /** Interactive controls for the footer (wishlist, add to cart). Replaces `ctaLabel` when set. */
  actions?: ReactNode;
  ctaLabel?: string;
  /**
   * Artwork frame. `wide` (kit 16:10, cropped to fill) suits course banners. `natural` spans the
   * full card width and takes the image's own height — no crop, no side bars — for artwork with
   * content at the edges, e.g. consultant portraits with the name set at the bottom.
   */
  media?: "wide" | "natural";
  sizes?: string;
  className?: string;
  /** Where the card is rendered (e.g. "search", "related") and its position in the list, for click analytics. */
  tracking?: { surface?: string; position?: number };
};

const DEFAULT_SIZES = "(min-width: 1200px) 390px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw";

/**
 * Kit `.ma-card`. The title link stretches over the whole card (one tab stop, one accessible name)
 * instead of wrapping block content in an anchor.
 */
export function ProductCard({
  href,
  title,
  image,
  color,
  tag,
  summary,
  tags = [],
  meta = [],
  price,
  actions,
  ctaLabel,
  media = "wide",
  sizes = DEFAULT_SIZES,
  className,
  tracking,
}: ProductCardProps) {
  return (
    <article className={cn("ma-card group relative h-full focus-within:border-line-strong", className)}>
      <div
        className={cn(
          "ma-card__media relative overflow-hidden p-0",
          media === "natural" && "block aspect-auto",
          brandBg[color],
        )}
      >
        {image && media === "natural" ? (
          // width/height only seed the srcset and the pre-load box; `h-auto` lets the loaded image's
          // real proportions set the height, so it always fills the width without cropping.
          <Image
            src={image}
            alt=""
            width={640}
            height={640}
            sizes={sizes}
            className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : null}
      </div>

      <div className="ma-card__body">
        {/* Tag lives in the body, not over the artwork: course images carry their own text. */}
        {tag ? <span className="ma-tag ma-tag--soft self-start">{tag}</span> : null}
        <h3 className="ma-card__title line-clamp-2">
          <TrackedCardLink
            href={href}
            title={title}
            tracking={tracking}
            className="text-fg no-underline after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </TrackedCardLink>
        </h3>
        {summary ? <p className="m-0 line-clamp-2 text-sm leading-6 text-fg-muted">{summary}</p> : null}
        {tags.length > 0 ? (
          // Above the card's stretched title link (`relative z-10`), like the footer actions.
          <ul className="relative z-10 m-0 flex list-none flex-wrap gap-2 p-0">
            {tags.map((item) => (
              <li key={item.href}>
                <AppLink
                  href={item.href}
                  // The pseudo-element grows the touch target to 44px without growing the chip.
                  className="ma-tag ma-tag--soft relative no-underline before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] transition-colors hover:bg-fg hover:text-surface"
                >
                  {item.label}
                </AppLink>
              </li>
            ))}
          </ul>
        ) : null}
        {meta.length > 0 ? (
          // `mt-auto`: cards in a rail share the tallest one's height; the spare room goes above the
          // meta row, so it always sits right on the footer instead of floating over a gap.
          <ul className="ma-card__meta m-0 mt-auto list-none p-0">
            {meta.map(({ icon: Icon, label, avatar }) => (
              <li key={label} className="inline-flex items-center gap-1">
                {avatar ? (
                  // Decorative: the name beside it says who it is.
                  <span className="relative me-0.5 size-6 shrink-0 overflow-hidden rounded-full border border-line bg-surface-alt">
                    <Image src={avatar} alt="" fill sizes="24px" className="object-cover" />
                  </span>
                ) : (
                  // `fill-none`: the kit fills meta svgs, which turns Lucide outline icons into solid shapes.
                  <Icon aria-hidden="true" className="size-3.5 shrink-0 fill-none" strokeWidth={2} />
                )}
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="ma-card__foot">
        <PriceTag price={price} />
        {actions ?? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted transition-colors group-hover:text-fg">
            {ctaLabel}
            <ArrowLeft aria-hidden="true" className="size-4" />
          </span>
        )}
      </div>
    </article>
  );
}

/** Current price, with the pre-offer price struck through beside it; "مجاني" for free items. */
function PriceTag({ price }: { price?: Pricing | null }) {
  const original = price?.original ? (
    <>
      <span className="sr-only">بدلاً من</span>
      <del dir="ltr" className="text-sm font-medium text-fg-muted line-through">
        {price.original}
      </del>
    </>
  ) : null;

  if (price?.free) {
    return (
      <span className="flex min-h-7 items-center gap-2 tabular-nums">
        <span className="ma-tag ma-tag--green font-bold">مجاني</span>
        {original}
      </span>
    );
  }
  if (!price?.current) {
    return <span className="min-h-7" />;
  }
  return (
    <span className="flex min-h-7 flex-wrap items-baseline gap-x-2 tabular-nums">
      {original ? <span className="sr-only">السعر بعد الخصم</span> : null}
      <span dir="ltr" className="text-lg font-bold">
        {price.current}
      </span>
      {original}
    </span>
  );
}
