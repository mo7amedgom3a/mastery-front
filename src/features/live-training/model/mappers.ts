import { routes } from "@/config/routes";
import { formatCount } from "@/lib/format";
import { toPricing } from "@/lib/pricing";
import type { BrandColor } from "@/components/ui/brand-colors";
import type { LiveDiploma } from "@/lib/api/live-diplomas";

import type { LiveTrainingDetailDto, LiveTrainingDetailVM, LiveTrainingDetailsDto, LiveTrainingDto, LiveTrainingVM } from "./types";

// Arabic copy with Latin digits, like `lib/format`.
const LOCALE = "ar-u-nu-latn";

const DAY_FORMS = { one: "يوم تدريبي واحد", two: "يومان تدريبيان", few: "أيام تدريبية", many: "يوماً تدريبياً" };

// Wall-clock times carry no date or zone: format them as UTC so nothing shifts.
const clockFormatter = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

/** The storefront-owned marketing object carried by `LiveDiploma.marketing`. */
type Marketing = {
  title_en?: string | null;
  subtitle?: string | null;
  summary?: string | null;
  cover_image?: string | null;
  hero_image?: string | null;
  trainer?: { name?: string; title?: string | null; image?: string | null };
  timezone_label?: string | null;
  location?: string | null;
  certificate?: string | null;
  price_sar?: number | null;
  intro_video_youtube_id?: string | null;
  highlights?: string[];
  style?: BrandColor;
  featured?: boolean;
  whatsapp?: string | null;
  details?: LiveTrainingDetailsDto;
};

const EMPTY_DETAILS: LiveTrainingDetailsDto = {
  about: { title: "", paragraphs: [] },
  objectives: [],
  audience: { lead: "", items: [] },
  axes: { title: "", lead: "", items: [] },
  activities: { lead: "", groups: [] },
  method: [],
  trainer_bio: { credentials: [], roles: "", paragraphs: [] },
  features: [],
  certificates: [],
  faqs: [],
  whatsapp: null,
};

/** "19:30" → "7:30 م"; null when the value isn't HH:mm. */
function formatWallClock(value: string): string | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? clockFormatter.format(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2]))) : null;
}

/** "2026-12-14T19:30:00+03:00" → "19:30" in the diploma's own timezone. */
function toHHMM(iso: string | undefined, timezone: string): string {
  if (!iso) return "00:00";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "00:00";
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** "5–10 أكتوبر 2026", in the training's own timezone so every visitor sees the same days. */
function formatDateRange(startsAt: string, endsAt: string, timeZone: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const formatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone });
  return end > start ? formatter.formatRange(start, end) : formatter.format(start);
}

function formatSessionTime(dto: LiveTrainingDto): string {
  const start = formatWallClock(dto.session_start);
  const end = formatWallClock(dto.session_end);
  const window = start && end ? `${start} – ${end}` : (start ?? "");
  return `${window} (${dto.timezone_label})`.trim();
}

/** Upcoming or still running at `now`: the last session hasn't ended. */
export function isOpen(dto: LiveTrainingDto, now: number): boolean {
  const end = Date.parse(dto.ends_at);
  return Number.isFinite(end) && end > now;
}

export function byStartDate(a: LiveTrainingDto, b: LiveTrainingDto): number {
  return Date.parse(a.starts_at) - Date.parse(b.starts_at);
}

/** Stable numeric id from the slug (used only as a React key). */
function slugId(slug: string): number {
  let hash = 7;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) % 1_000_000;
  return hash;
}

type ScheduleSlot = { starts_at?: string; ends_at?: string; title?: string; slot_number?: number };

/** The last session end (ISO) from the schedule, else the latest cohort end, else the start. */
function lastEndsAt(diploma: LiveDiploma): string {
  const schedule = (diploma.schedule ?? []) as ScheduleSlot[];
  const scheduleEnds = schedule
    .map((slot) => slot.ends_at)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort();
  if (scheduleEnds.length > 0) return scheduleEnds[scheduleEnds.length - 1];
  const cohortEnds = (diploma.cohorts ?? []).map((cohort) => cohort.ends_at).filter(Boolean).sort();
  return cohortEnds[cohortEnds.length - 1] ?? diploma.starts_at ?? "";
}

/** Cohort label from the diploma's cohort numbers, e.g. "الدفعة 21". */
function cohortLabel(diploma: LiveDiploma): string | null {
  const numbers = (diploma.cohorts ?? []).map((cohort) => cohort.cohort_number).filter((n) => n > 0);
  return numbers.length > 0 ? `الدفعة ${Math.max(...numbers)}` : null;
}

/** Maps a backend `LiveDiploma` (+ its `marketing` object) to the storefront DTO. */
export function fromLiveDiploma(diploma: LiveDiploma): LiveTrainingDetailDto {
  const marketing = (diploma.marketing ?? {}) as Marketing;
  const trainer = marketing.trainer ?? {};
  const timezone = diploma.timezone_name;
  const startsAt = diploma.starts_at ?? "";
  const endsAt = lastEndsAt(diploma);
  const schedule = (diploma.schedule ?? []) as ScheduleSlot[];
  const lastSlot = schedule[schedule.length - 1];

  return {
    id: slugId(diploma.slug),
    slug: diploma.slug,
    catalog_slug: diploma.slug,
    title: diploma.title,
    title_en: marketing.title_en ?? null,
    subtitle: marketing.subtitle ?? diploma.short_description ?? null,
    summary: marketing.summary ?? null,
    cohort_label: cohortLabel(diploma),
    cover_image: marketing.cover_image ?? diploma.image_url ?? null,
    hero_image: marketing.hero_image ?? trainer.image ?? null,
    trainer: {
      name: trainer.name ?? "ماستري أكاديمي",
      title: trainer.title ?? null,
      image: trainer.image ?? null,
    },
    starts_at: startsAt,
    ends_at: endsAt,
    sessions_count: diploma.session_count ?? schedule.length,
    session_start: toHHMM(startsAt, timezone),
    session_end: toHHMM(lastSlot?.ends_at ?? endsAt, timezone),
    timezone,
    timezone_label: marketing.timezone_label ?? "بتوقيت مكة",
    location: marketing.location ?? "أونلاين (بث مباشر)",
    certificate: marketing.certificate ?? null,
    price: { usd: Number(diploma.price_usd), sar: marketing.price_sar ?? null },
    intro_video_youtube_id: marketing.intro_video_youtube_id ?? null,
    brochure_url: diploma.brochure_url ?? null,
    highlights: marketing.highlights ?? [],
    style: marketing.style ?? "coral",
    featured: marketing.featured ?? false,
    details: marketing.details ?? EMPTY_DETAILS,
    readme: diploma.readme?.trim() ? diploma.readme : null,
  };
}

/** The list item: everything but the long-form page content. */
export function toListItem(dto: LiveTrainingDetailDto): LiveTrainingDto {
  const item: Partial<LiveTrainingDetailDto> = { ...dto };
  delete item.details;
  delete item.readme;
  return item as LiveTrainingDto;
}

export function toLiveTrainingVM(dto: LiveTrainingDto): LiveTrainingVM {
  return {
    id: dto.id,
    title: dto.title,
    titleEn: dto.title_en,
    catalogSlug: dto.catalog_slug,
    subtitle: dto.subtitle,
    summary: dto.summary,
    cohort: dto.cohort_label,
    coverImage: dto.cover_image,
    heroImage: dto.hero_image ?? dto.trainer.image,
    trainerName: dto.trainer.name,
    trainerTitle: dto.trainer.title,
    dateRange: formatDateRange(dto.starts_at, dto.ends_at, dto.timezone),
    sessions: dto.sessions_count > 0 ? formatCount(dto.sessions_count, DAY_FORMS) : "",
    sessionTime: formatSessionTime(dto),
    location: dto.location,
    certificate: dto.certificate,
    price: toPricing(dto.price.usd),
    priceAmount: dto.price.usd,
    priceSar: dto.price.sar,
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    trailerEmbedUrl: dto.intro_video_youtube_id
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(dto.intro_video_youtube_id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : null,
    brochureUrl: dto.brochure_url,
    highlights: dto.highlights,
    color: dto.style,
    featured: dto.featured,
    href: routes.liveTraining(dto.slug),
  };
}

export function toLiveTrainingDetailVM(dto: LiveTrainingDetailDto): LiveTrainingDetailVM {
  const digits = dto.details.whatsapp?.replace(/\D/g, "") ?? "";
  return {
    ...toLiveTrainingVM(dto),
    details: dto.details,
    readme: dto.readme,
    whatsappHref: digits ? `https://wa.me/${digits}` : null,
    whatsappLabel: digits ? `+${digits}` : null,
  };
}
