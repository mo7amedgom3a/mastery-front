import { kindLabel } from "@/lib/shop/labels";
import type { ShopItemKind } from "@/lib/shop/store";

const TYPE_LABELS: Record<string, string> = { ...kindLabel, bundle: "حزمة" } satisfies Partial<
  Record<ShopItemKind | "bundle", string>
>;

/** Singular label of a catalog product type ("دورة"); the raw code when unknown. */
export function productTypeLabel(productType: string): string {
  return TYPE_LABELS[productType] ?? productType;
}

/** Image hosts `next.config.ts` allows; anything else would make `next/image` throw. */
const IMAGE_HOSTS = new Set(["live.emasteryacademy.com", "public.emasteryacademy.com"]);

export function safeImage(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return IMAGE_HOSTS.has(new URL(url).hostname) ? url : null;
  } catch {
    return null;
  }
}

/** API prices are decimal strings ("129.00"); null when missing or not a number. */
export function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
