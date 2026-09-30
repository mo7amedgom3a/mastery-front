import type { AddonCode, ShopItemKind } from "@/lib/shop/contract";

export type AddonDef = {
  code: AddonCode;
  title: string;
  description: string;
  /** Price per product kind, in major units; a kind without an entry can't take the add-on. */
  amounts: Partial<Record<ShopItemKind, number>>;
};

/**
 * MOCK: the paid extras offered on a cart line. The titles are real offers (programs include a
 * year of access and a completion certificate; CPD hours are sold for an extra fee), but the
 * PRICES ARE PLACEHOLDERS until the business sets them.
 * TODO(api): read add-ons and their prices from the backend (`b2c.entitlement_extensions`, certificates).
 */
export const ADDONS: readonly AddonDef[] = [
  {
    code: "unlimited_access",
    title: "وصول مدى الحياة",
    description: "احتفظ بالمحتوى وتحديثاته بلا تاريخ انتهاء، بدلاً من عام واحد.",
    amounts: { course: 29, diploma: 59, package: 79 },
  },
  {
    code: "cpd_certificate",
    title: "شهادة CPD معتمدة دولياً",
    description: "ساعات تدريبية معتمدة من CPD البريطانية، إضافةً إلى شهادة الإتمام.",
    amounts: { course: 35, diploma: 49 },
  },
];

export const ADDON_CODES: readonly AddonCode[] = ADDONS.map((addon) => addon.code);

/** The add-ons a product of this kind can take, with their price for it. */
export function addonsFor(kind: ShopItemKind): { def: AddonDef; amount: number }[] {
  return ADDONS.flatMap((def) => {
    const amount = def.amounts[kind];
    return amount === undefined ? [] : [{ def, amount }];
  });
}
