import type { BrandColor } from "@/components/ui/brand-colors";

export type Expert = {
  id: string;
  name: string;
  field: string;
  /** 480 px portrait for the hero and the larger expert cards. */
  image: string;
  /** 256 px portrait for small cards (192 px slots). */
  imageSmall: string;
  color: BrandColor;
};

/**
 * Local, pre-optimized WebP portraits (see `scripts/optimize-landing-experts.mjs`).
 *
 * The legacy uploads are 500–800 KB PNGs; the hero renders nine of them, twice per column, so
 * loading them raw pushed mobile LCP past 5 s. Both sizes live under `public/landing/experts/`
 * and are immutable: no third-party fetch, no cold `/_next/image` optimization on first visit.
 */
const portrait = (id: string) => ({
  image: `/landing/experts/${id}-480.webp`,
  imageSmall: `/landing/experts/${id}-256.webp`,
});

/** Curated line-up from landing_page_assessts.txt (the API has no "featured experts" list yet). */
export const experts: readonly Expert[] = [
  {
    id: "thabet-hegazy",
    name: "د. ثابت حجازي",
    field: "خبير التسويق وتنمية المبيعات",
    ...portrait("thabet-hegazy"),
    color: "coral",
  },
  {
    id: "sahl-mahdi",
    name: "د. سهل مهدي",
    field: "خبير التسويق الإلكتروني",
    ...portrait("sahl-mahdi"),
    color: "yellow",
  },
  {
    id: "huthaifa-hegazy",
    name: "حذيفة حجازي",
    field: "فنان تشكيلي",
    ...portrait("huthaifa-hegazy"),
    color: "sky",
  },
  {
    id: "nashmi-alharbi",
    name: "نشمي الحربي",
    field: "خبير الإمداد والمشتريات",
    ...portrait("nashmi-alharbi"),
    color: "green",
  },
  {
    id: "fatima-belhaddad",
    name: "فاطمة بالحداد",
    field: "خبيرة تصميم الأزياء",
    ...portrait("fatima-belhaddad"),
    color: "lilac",
  },
  {
    id: "marwa-alsharaa",
    name: "مروة الشرع",
    field: "خبيرة التصوير الفوتوغرافي",
    ...portrait("marwa-alsharaa"),
    color: "teal",
  },
  {
    id: "mazhar-kantakji",
    name: "مظهر قنطقجي",
    field: "خبير المالية والمحاسبة",
    ...portrait("mazhar-kantakji"),
    color: "purple",
  },
  {
    id: "ahmed-aljarhi",
    name: "أحمد الجارحي",
    field: "خبير التنمية والتطوير",
    ...portrait("ahmed-aljarhi"),
    color: "pink",
  },
  {
    id: "mohammed-alzubaidi",
    name: "محمد الزبيدي",
    field: "متخصص تحسين الجودة",
    ...portrait("mohammed-alzubaidi"),
    color: "cream",
  },
];
