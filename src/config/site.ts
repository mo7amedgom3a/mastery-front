import type { Metadata } from "next";

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
  social: [
    "https://instagram.com/emasteryacademy",
    "https://www.facebook.com/emasteryacademy",
    "https://x.com/emasteryacademy",
    "https://www.linkedin.com/company/emasteryacademy",
    "https://www.youtube.com/c/eMasteryAcademy",
  ] as readonly string[],
  /** Topics the academy is about; `knowsAbout` on the Organization entity (search + AI answers). */
  knowsAbout: [
    "التسويق الرقمي",
    "التجارة الإلكترونية",
    "ريادة الأعمال",
    "الإدارة والقيادة",
    "الذكاء الاصطناعي",
    "المالية والمحاسبة",
    "المبيعات وخدمة العملاء",
    "الموارد البشرية والتدريب",
    "إدارة المشاريع",
  ] as readonly string[],
  /** The mobile app's store listings. */
  apps: {
    appStore: "https://apps.apple.com/tr/app/mastery-academy/id1661460868",
    googlePlay: "https://play.google.com/store/apps/details?id=co.emastery.emasteryacademy",
  },
  introVideoUrl: "https://public.emasteryacademy.com/intronosound.mp4",
  /** eMastery Business dashboard, where a company adds its employees after subscribing. Unset: the seat page. */
  b2bDashboardUrl: process.env.NEXT_PUBLIC_B2B_DASHBOARD_URL?.trim() || null,
} as const;

/**
 * Open Graph fields every page shares. Pages that set their own `openGraph` replace the parent's
 * object entirely, so they spread this in to keep og:site_name, og:locale and the default share
 * image. Without the explicit image the file convention's `og:image` disappeared on every page
 * that defined its own `openGraph` (the homepage, listings, legal pages, …).
 */
export const defaultOgImage = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "ماستري أكاديمي — نبني قادة العصر الرقمي: دورات ودبلومات بالعربية مع خبراء ماستري",
};

export const baseOpenGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  locale: siteConfig.ogLocale,
  siteName: siteConfig.name,
  images: [defaultOgImage],
};

/** The same fallback for Twitter/X; page-level covers override it when they exist. */
export const defaultTwitterImage = {
  url: "/twitter-image.jpg",
  width: 1200,
  height: 630,
  alt: defaultOgImage.alt,
};

export const baseTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  images: [defaultTwitterImage],
};

