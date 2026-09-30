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

/** Lesson length as a clock, e.g. 235 → "3:55", 3725 → "1:02:05". Render inside dir="ltr". */
export function formatClock(seconds: number | null | undefined): string | null {
  if (!seconds || seconds < 1) {
    return null;
  }
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function formatMinutes(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) {
    return null;
  }
  return minutes >= 60 && minutes % 60 === 0 ? formatHours(minutes / 60) : `${Math.round(minutes)} دقيقة`;
}

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long" });
const timeFormatter = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" });

/** A day in the reader's own timezone, e.g. "السبت، 3 أكتوبر". */
export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

/** Time of day in the reader's own timezone, e.g. "5:00 م". */
export function formatTimeOfDay(date: Date): string {
  return timeFormatter.format(date);
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

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  zwnj: "\u200c",
  zwj: "\u200d",
  rlm: "",
  lrm: "",
};

/** Decodes the HTML entities legacy rich text uses (named ones above, plus numeric `&#…;`). */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Turns legacy rich-text fields into plain text; the landing page never injects raw HTML. */
export function toPlainText(value: string | null | undefined, maxLength = 180): string | null {
  if (!value) {
    return null;
  }
  const text = decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h\d)>/gi, " ")
      .replace(/<[^>]*>/g, ""),
  )
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

/** A person's name without the leading honorific legacy names carry ("أ. كريم عصام" → "كريم عصام"). */
export function stripHonorific(name: string): string {
  return name.replace(/^(?:أ\.?\s*د\.?|أ\.|د\.|م\.)\s*/u, "");
}

/** Legacy rich text as plain-text blocks: paragraphs and lists, nothing else survives. */
export type TextBlock = { type: "p"; text: string } | { type: "list"; ordered: boolean; items: string[] };

// Authors often type bullets into plain paragraphs ("- الهدف الأول") instead of using a list.
const TYPED_BULLET = /^\s*(?:[-–—•●▪*]|\d{1,2}[.)-])\s+/;
const BLOCK_TAG = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi;

function cleanFragment(value: string): string {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

/**
 * Parses the Quill HTML stored in legacy fields (`<p>`, `<ol>/<ul>/<li>`, `<br>`, inline spans with
 * inline styles) into paragraphs and lists of plain text. Tags, styles and attributes are dropped,
 * so the result is always safe to render as text. Runs of paragraphs that start with a typed bullet
 * become one list.
 */
export function toTextBlocks(html: string | null | undefined): TextBlock[] {
  if (!html) {
    return [];
  }
  const source = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const raw: TextBlock[] = [];
  let buffer = "";
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    const text = cleanFragment(buffer);
    buffer = "";
    if (!text) return;
    if (list) list.items.push(text);
    else raw.push({ type: "p", text });
  };

  let cursor = 0;
  for (const match of source.matchAll(BLOCK_TAG)) {
    buffer += source.slice(cursor, match.index);
    cursor = match.index + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();

    if (tag === "ol" || tag === "ul") {
      flush();
      if (!closing) {
        list = { ordered: tag === "ol", items: [] };
      } else if (list) {
        if (list.items.length > 0) raw.push({ type: "list", ...list });
        list = null;
      }
    } else if (tag === "li" || (!list && /^(p|div|br|h[1-6]|blockquote)$/.test(tag))) {
      flush();
    } else if (tag === "br") {
      buffer += " ";
    }
  }
  buffer += source.slice(cursor);
  flush();
  if (list && list.items.length > 0) raw.push({ type: "list", ...list });

  // Fold typed-bullet paragraphs into lists.
  const blocks: TextBlock[] = [];
  for (const block of raw) {
    if (block.type === "p" && TYPED_BULLET.test(block.text)) {
      const text = block.text.replace(TYPED_BULLET, "");
      const previous = blocks.at(-1);
      if (previous?.type === "list" && !previous.ordered) previous.items.push(text);
      else blocks.push({ type: "list", ordered: false, items: [text] });
    } else {
      blocks.push(block);
    }
  }
  return blocks;
}

/** Card label for a product's instructors: the lead one, with "وآخرون" when there are more. */
export function instructorLabel(names: readonly string[] | undefined): string | null {
  if (!names || names.length === 0) return null;
  return names.length > 1 ? `${names[0]} وآخرون` : names[0];
}
