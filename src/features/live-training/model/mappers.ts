import { brandColorAt } from "@/components/ui/brand-colors";
import { routes } from "@/config/routes";
import { formatCount } from "@/lib/format";
import { toPricing } from "@/lib/pricing";

import type { LiveTrainingDetailDto, LiveTrainingDetailVM, LiveTrainingDto, LiveTrainingVM } from "./types";

// Arabic copy with Latin digits, like `lib/format`.
const LOCALE = "ar-u-nu-latn";

const DAY_FORMS = { one: "يوم تدريبي واحد", two: "يومان تدريبيان", few: "أيام تدريبية", many: "يوماً تدريبياً" };

// Wall-clock times carry no date or zone: format them as UTC so nothing shifts.
const clockFormatter = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

/** "19:30" → "7:30 م"; null when the value isn't HH:mm. */
function formatWallClock(value: string): string | null {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? clockFormatter.format(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2]))) : null;
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

export function toLiveTrainingVM(dto: LiveTrainingDto): LiveTrainingVM {
  return {
    id: dto.id,
    title: dto.title,
    titleEn: dto.title_en,
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
    enrollUrl: dto.enroll_url,
    highlights: dto.highlights,
    color: brandColorAt(dto.id),
    href: routes.liveTraining(dto.slug),
  };
}

export function toLiveTrainingDetailVM(dto: LiveTrainingDetailDto): LiveTrainingDetailVM {
  const digits = dto.details.whatsapp?.replace(/\D/g, "") ?? "";
  return {
    ...toLiveTrainingVM(dto),
    details: dto.details,
    whatsappHref: digits ? `https://wa.me/${digits}` : null,
    whatsappLabel: digits ? `+${digits}` : null,
  };
}
