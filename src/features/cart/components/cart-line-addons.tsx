import { Award, Truck } from "lucide-react";

import { Money } from "@/components/shop/money";
import { cn } from "@/lib/cn";
import type { AddonCode, QuoteAddon } from "@/lib/shop/contract";

/**
 * The certificate extras a cart line's product offers (CPD mark, printed copy), as an upsell under
 * the line. Ticking one adds it to the order; coupons never discount them.
 */
export function CartLineAddons({
  addons,
  lineTitle,
  disabled,
  onToggle,
}: {
  addons: QuoteAddon[];
  lineTitle: string;
  disabled: boolean;
  onToggle: (code: AddonCode, selected: boolean) => void;
}) {
  if (addons.length === 0) return null;
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" disabled={disabled}>
      <legend className="mb-2 p-0 text-sm font-bold">
        طوّر شهادتك <span className="sr-only">لـ «{lineTitle}»</span>
      </legend>
      {addons.map((addon) => {
        const Icon = addon.requiresShipping ? Truck : Award;
        return (
          <label
            key={addon.code}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors",
              addon.selected ? "border-accent bg-accent/5" : "border-line hover:border-line-strong",
              disabled && "cursor-wait opacity-70",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              checked={addon.selected}
              onChange={(event) => onToggle(addon.code, event.target.checked)}
            />
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-bold">{addon.title}</span>
                <span className="font-bold">
                  + <Money amount={addon.amount} />
                </span>
              </span>
              {addon.description ? <span className="text-sm leading-6 text-fg-muted">{addon.description}</span> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
