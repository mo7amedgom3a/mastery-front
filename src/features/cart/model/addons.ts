import type { AddonCode } from "@/lib/shop/contract";

/** Certificate add-ons a cart line can carry; which ones a product offers, and their prices, come from the backend. */
export const ADDON_CODES: readonly AddonCode[] = ["cpd_certificate", "physical_certificate"];

export function isAddonCode(value: unknown): value is AddonCode {
  return (ADDON_CODES as readonly unknown[]).includes(value);
}

/** An add-on as a product offers it (major units). */
export type AddonOfferDef = {
  code: AddonCode;
  title: string;
  description: string;
  amount: number;
  requiresShipping: boolean;
};
