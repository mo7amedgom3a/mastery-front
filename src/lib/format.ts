import { siteConfig } from "@/config/site";

// Arabic copy with Latin digits: matches how prices and counts appear across the product.
const LOCALE = "ar-u-nu-latn";

// The Arabic locale renders "129 US$", which bidi-flips to "$US 129"; "$129" is what learners expect.
// Render prices inside a dir="ltr" element.
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatPrice(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return priceFormatter.format(amount);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Legacy durations are stored in seconds. */
export function formatDurationFromSeconds(seconds: number | null | undefined): string | null {
  if (!seconds || seconds < 60) {
    return null;
  }
  const hours = seconds / 3600;
  if (hours < 1) {
    return `${Math.round(seconds / 60)} دقيقة`;
  }
  return formatHours(Math.round(hours));
}

export function formatMinutes(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) {
    return null;
  }
  return minutes >= 60 && minutes % 60 === 0 ? formatHours(minutes / 60) : `${Math.round(minutes)} دقيقة`;
}

const pluralRules = new Intl.PluralRules("ar");

export type ArabicCountForms = {
  /** Standalone singular, e.g. "دورة واحدة". */
  one: string;
  /** Dual, e.g. "دورتان". */
  two: string;
  /** Noun after 3–10, e.g. "دورات". */
  few: string;
  /** Noun after 11+, e.g. "دورة". */
  many: string;
};

/** Arabic counted noun with correct plural form: 1 دورة واحدة · 2 دورتان · 5 دورات · 12 دورة. */
export function formatCount(count: number, forms: ArabicCountForms): string {
  switch (pluralRules.select(count)) {
    case "one":
      return forms.one;
    case "two":
      return forms.two;
    case "few":
      return `${formatNumber(count)} ${forms.few}`;
    default:
      return `${formatNumber(count)} ${forms.many}`;
  }
}

function formatHours(hours: number): string {
  return formatCount(hours, { one: "ساعة واحدة", two: "ساعتان", few: "ساعات", many: "ساعة" });
}

/** Turns legacy rich-text fields into plain text; the landing page never injects raw HTML. */
export function toPlainText(value: string | null | undefined, maxLength = 180): string | null {
  if (!value) {
    return null;
  }
  const text = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h\d)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return null;
  }
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > maxLength * 0.6 ? lastSpace : maxLength).trim()}…`;
}

export function cleanText(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text : null;
}
