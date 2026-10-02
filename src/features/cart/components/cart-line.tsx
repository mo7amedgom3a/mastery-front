import { Heart, Trash2 } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import { brandBg, type BrandColor } from "@/components/ui/brand-colors";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { AddonCode, Quote, QuoteLine, ShopItemKind } from "@/lib/shop/contract";
import { kindLabel } from "@/lib/shop/labels";
import type { CartLine } from "@/lib/shop/store";

const kindColor: Record<ShopItemKind, BrandColor> = {
  course: "coral",
  diploma: "yellow",
  package: "green",
  consultation: "lilac",
};

type UnavailableReason = Quote["unavailable"][number]["reason"];

const unavailableText: Record<UnavailableReason, string> = {
  missing: "لم يعد هذا المنتج متاحاً، ولن يُحتسب في طلبك.",
  inactive: "هذا المنتج غير متاح للشراء حالياً، ولن يُحتسب في طلبك.",
  free: "أصبح هذا البرنامج مجانياً: سجّل فيه مباشرةً من صفحته، دون المرور بالسلة.",
  unpriced: "سعر هذا المنتج غير متاح حالياً، ولن يُحتسب في طلبك.",
  not_purchasable: "لا يُشترى هذا المنتج من السلة، ولن يُحتسب في طلبك.",
};

type CartLineRowProps = {
  line: CartLine;
  /** The priced line; undefined until the quote covers this item. */
  quoted: QuoteLine | undefined;
  /** Set when the quote refused the item. */
  unavailable: UnavailableReason | undefined;
  /** Whether the item is already in the wishlist ("save for later" then only removes it here). */
  saved: boolean;
  onToggleAddon: (key: string, addon: AddonCode) => void;
  onSaveForLater: (line: CartLine) => void;
  onRemove: (line: CartLine) => void;
};

/**
 * One product in the cart: what it is, what it costs now (the offer price, with the original struck
 * through), its paid extras, and the coupon's share. Titles, artwork and prices come from the quote
 * once it arrives; until then the row shows what was saved with the item.
 */
export function CartLineRow({ line, quoted, unavailable, saved, onToggleAddon, onSaveForLater, onRemove }: CartLineRowProps) {
  const item = quoted?.item;
  const title = item?.title ?? line.title;
  const image = item?.image ?? line.image;
  const href = (item?.href ?? line.href) as Route;
  const kind = item?.kind ?? line.kind;
  const details = [item?.instructor, item?.duration].filter(Boolean).join(" · ");
  const titleId = `cart-line-${line.key.replace(":", "-")}`;

  return (
    <article aria-labelledby={titleId} className={cn("flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 sm:p-5", unavailable && "border-dashed")}>
      <div className="flex gap-4">
        <div className={cn("relative aspect-[16/10] w-24 shrink-0 overflow-hidden sm:w-36", brandBg[kindColor[kind]], unavailable && "opacity-50")}>
          {image ? <Image src={image} alt="" fill sizes="(min-width: 600px) 144px, 96px" className="object-cover" /> : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <span className="ma-tag ma-tag--soft">{kindLabel[kind]}</span>
            <h3 id={titleId} className="m-0 text-base leading-7 font-bold sm:text-lg">
              <AppLink href={href} className="text-fg no-underline hover:underline">
                {title}
              </AppLink>
            </h3>
            {details ? <p className="m-0 text-sm text-fg-muted">{details}</p> : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            {quoted ? (
              <>
                <p className="m-0 flex flex-wrap items-baseline gap-x-2">
                  {quoted.originalAmount !== null ? <span className="sr-only">السعر بعد العرض</span> : null}
                  <Money amount={quoted.unitAmount} className="text-xl font-bold" />
                  {quoted.originalAmount !== null ? (
                    <>
                      <span className="sr-only">بدلاً من</span>
                      <del>
                        <Money amount={quoted.originalAmount} className="text-sm text-fg-muted" />
                      </del>
                    </>
                  ) : null}
                </p>
                {quoted.originalAmount !== null ? (
                  <span className="ma-tag ma-tag--green">
                    وفّرت <Money amount={quoted.originalAmount - quoted.unitAmount} />
                  </span>
                ) : null}
              </>
            ) : unavailable ? null : line.priceAmount !== null ? (
              // Saved price while the catalog answers; the quote replaces it.
              <Money amount={line.priceAmount} className="animate-pulse text-xl font-bold text-fg-muted motion-reduce:animate-none" />
            ) : (
              <Skeleton className="h-7 w-16" />
            )}
          </div>
        </div>
      </div>

      {unavailable ? (
        <p role="note" className="m-0 border-s-4 border-accent ps-3 text-sm leading-6">
          {unavailableText[unavailable]}
        </p>
      ) : null}

      {quoted && quoted.addons.length > 0 ? (
        <div role="group" aria-label={`إضافات «${title}»`} className="flex min-w-0 flex-col gap-1 border-t border-line pt-3">
          <p className="m-0 text-sm font-bold">أضف إلى هذا المنتج</p>
          {quoted.addons.map((addon) => {
            // Checked state follows the cart itself, so a tick shows at once; the quote catches up.
            const checked = line.addons.includes(addon.code);
            return (
              <label
                key={addon.code}
                className={cn("ma-check w-full items-start gap-3 py-2", checked && "font-medium")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleAddon(line.key, addon.code)}
                  className="mt-1 shrink-0"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{addon.title}</span>
                  <span className="text-sm leading-6 font-normal text-fg-muted">{addon.description}</span>
                </span>
                <span className="shrink-0 font-bold">
                  <span aria-hidden="true">+</span>
                  <span className="sr-only">بإضافة </span>
                  <Money amount={addon.amount} />
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-2">
          <button type="button" onClick={() => onSaveForLater(line)} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5">
            <Heart aria-hidden="true" className="size-4 fill-none" />
            {saved ? "أبقِه في المفضلة فقط" : "انقله إلى المفضلة"}
            <span className="sr-only">: «{title}»</span>
          </button>
          <button type="button" onClick={() => onRemove(line)} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5">
            <Trash2 aria-hidden="true" className="size-4 fill-none" />
            إزالة
            <span className="sr-only"> «{title}» من السلة</span>
          </button>
        </div>

        {quoted && (quoted.addonsAmount > 0 || quoted.discountAmount > 0) ? (
          <dl className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {quoted.discountAmount > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <dt className="text-fg-muted">خصم القسيمة</dt>
                <dd className="m-0 font-bold">
                  <span dir="ltr">−</span>
                  <Money amount={quoted.discountAmount} />
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline gap-1.5">
              <dt className="text-fg-muted">إجمالي المنتج</dt>
              <dd className="m-0 text-base font-bold">
                <Money amount={quoted.totalAmount} />
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </article>
  );
}
