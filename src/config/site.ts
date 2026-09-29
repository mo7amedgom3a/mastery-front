export const siteConfig = {
  name: "ماستري أكاديمي",
  nameEn: "E-Mastery Academy",
  title: "ماستري أكاديمي | E-Mastery Academy — تعلّم التسويق وريادة الأعمال",
  description:
    "ماستري أكاديمي: منصة تعليمية عربية رائدة متخصصة في التسويق الرقمي، التجارة الإلكترونية، ريادة الأعمال والذكاء الاصطناعي. دورات ودبلومات احترافية مع خبراء الصناعة.",
  shareDescription:
    "منصة تعليمية رائدة متخصصة في التجارة الإلكترونية والتسويق الرقمي والذكاء الاصطناعي. تعلّم من خبراء الصناعة وطبّق ما تتعلمه فوراً.",
  foundingYear: 2017,
  founders: ["ثابت حجازي", "سهل مهدي"],
  locale: "ar",
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
