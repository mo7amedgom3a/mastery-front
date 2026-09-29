import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg, type BrandColor } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";
import type { Pricing } from "@/lib/pricing";

export type ProductCardMeta = {
  icon: LucideIcon;
  label: string;
};

export type ProductCardProps = {
  href: Route;
  title: string;
  image?: string | null;
  /** Colour field shown when there is no image, and behind transparent artwork. */
  color: BrandColor;
  tag?: string | null;
  summary?: string | null;
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
};

const DEFAULT_SIZES = "(min-width: 1200px) 290px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 82vw";

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
  meta = [],
  price,
  actions,
  ctaLabel,
  media = "wide",
  sizes = DEFAULT_SIZES,
  className,
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
        {tag ? <span className="ma-tag ma-tag--outline self-start">{tag}</span> : null}
        <h3 className="ma-card__title line-clamp-2">
          <AppLink href={href} className="text-fg no-underline after:absolute after:inset-0 after:content-['']">
            {title}
          </AppLink>
        </h3>
        {summary ? <p className="m-0 line-clamp-2 text-sm leading-6 text-fg-muted">{summary}</p> : null}
        {meta.length > 0 ? (
          <ul className="ma-card__meta m-0 list-none p-0">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1">
                <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} />
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
