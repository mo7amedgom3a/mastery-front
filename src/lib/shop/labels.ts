import type { ArabicCountForms } from "@/lib/format";

import type { ShopItemKind } from "./contract";

export const KIND_ORDER: readonly ShopItemKind[] = ["course", "diploma", "live_diploma", "package", "consultation"];

/** Singular, for tags and rows: "دورة". */
export const kindLabel: Record<ShopItemKind, string> = {
  course: "دورة",
  diploma: "دبلوم",
  package: "باقة",
  consultation: "استشارة",
  live_diploma: "دبلوم مباشر",
};

/** Plural, for filter chips: "الدورات". */
export const kindPluralLabel: Record<ShopItemKind, string> = {
  course: "الدورات",
  diploma: "الدبلومات",
  package: "الباقات",
  consultation: "الاستشارات",
  live_diploma: "الدبلومات المباشرة",
};

export const ITEM_FORMS: ArabicCountForms = { one: "عنصر واحد", two: "عنصران", few: "عناصر", many: "عنصراً" };
export const PRODUCT_FORMS: ArabicCountForms = { one: "منتج واحد", two: "منتجان", few: "منتجات", many: "منتجاً" };
