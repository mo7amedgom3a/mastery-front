export const siteConfig = {
  name: "ماستري أكاديمي",
  nameEn: "E-Mastery Academy",
  // Length budgets (search/social truncation): title ≤ 60, description ≤ 155, shareDescription ≤ 125.
  title: "ماستري أكاديمي | E-Mastery Academy — دورات التسويق والأعمال",
  description:
    "ماستري أكاديمي: منصة تعليمية عربية في التسويق الرقمي والتجارة الإلكترونية وريادة الأعمال والذكاء الاصطناعي. دورات ودبلومات مع خبراء الصناعة.",
  shareDescription:
    "تعلّم التسويق الرقمي والتجارة الإلكترونية والذكاء الاصطناعي بالعربية مع خبراء الصناعة، وطبّق ما تتعلمه فوراً.",
  foundingYear: 2017,
  founders: ["ثابت حجازي", "سهل مهدي"],
  locale: "ar",
  /** Open Graph locale (language_TERRITORY); ar_AR is Facebook's pan-Arabic locale. */
  ogLocale: "ar_AR",
  currency: "USD",
  /** Square raster logo (Google needs ≥112px, non-SVG works everywhere); also the PWA icon. */
  logo: { url: "/brand/ma-icon-512.png", width: 512, height: 512 },
  /**
   * Official social profiles → `sameAs` in the Organization JSON-LD (entity signal for Google and
   * AI answer engines). Only add accounts the brand actually controls.
   */
  social: [] as readonly string[],
  introVideoUrl: "https://public.emasteryacademy.com/intronosound.mp4",
} as const;

/**
 * Open Graph fields every page shares. Pages that set their own `openGraph` replace the parent's
 * object entirely, so they spread this in to keep og:site_name and og:locale.
 */
export const baseOpenGraph = {
  type: "website",
  locale: siteConfig.ogLocale,
  siteName: siteConfig.name,
} as const;
