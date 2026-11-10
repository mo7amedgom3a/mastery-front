import { LEVEL_LABELS } from "@/features/onboarding/model/labels";
import type { InsightsActivity, InsightsRange } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

export const RANGE_LABELS: Record<InsightsRange, string> = {
  "30d": "آخر 30 يوماً",
  "90d": "آخر 3 أشهر",
  "365d": "آخر سنة",
};

export const SURFACE_LABELS: Record<string, string> = {
  learning: "التعلّم والاختبارات",
  dashboard: "اللوحة والرؤى",
  planner: "خطة التعلّم",
  catalog: "تصفّح البرامج",
  advisor: "المستشار الذكي",
  other: "أقسام أخرى",
};

export const STATUS_LABELS = {
  not_started: "لم تبدأ",
  in_progress: "قيد التعلّم",
  completed: "مكتملة",
} as const;

export function levelLabel(level: string | null | undefined): string | null {
  if (!level) return null;
  return LEVEL_LABELS[level]?.label ?? level;
}

/** "1 س 25 د", "40 د", or "0 د": compact enough for chart tiles and tooltips. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${formatNumber(rest)} د`;
  if (rest === 0) return `${formatNumber(hours)} س`;
  return `${formatNumber(hours)} س ${formatNumber(rest)} د`;
}

export function formatPercent(value: number | null | undefined): string {
  return value == null ? "—" : `${formatNumber(Math.round(value))}٪`;
}

const shortDay = new Intl.DateTimeFormat("ar", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("ar", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** A `YYYY-MM-DD` calendar day, independent of the reader's timezone. */
export function formatDayShort(isoDate: string): string {
  return shortDay.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDayLong(isoDate: string): string {
  return longDay.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Week rows of the heatmap, Saturday first. The API indexes weekdays Monday = 0. */
export const HEATMAP_DAYS: readonly { index: number; label: string; short: string }[] = [
  { index: 5, label: "السبت", short: "سبت" },
  { index: 6, label: "الأحد", short: "أحد" },
  { index: 0, label: "الاثنين", short: "اثنين" },
  { index: 1, label: "الثلاثاء", short: "ثلاثاء" },
  { index: 2, label: "الأربعاء", short: "أربعاء" },
  { index: 3, label: "الخميس", short: "خميس" },
  { index: 4, label: "الجمعة", short: "جمعة" },
];

export function hourLabel(hour: number): string {
  if (hour === 0) return "12 ص";
  if (hour === 12) return "12 م";
  return hour < 12 ? `${formatNumber(hour)} ص` : `${formatNumber(hour - 12)} م`;
}

/** The busiest local hour and weekday, or null when there is no activity yet. */
export function peakTimes(activity: InsightsActivity): { hour: number; day: string } | null {
  const hours = Array.from({ length: 24 }, (_, hour) => activity.heatmap.reduce((sum, row) => sum + (row[hour] ?? 0), 0));
  const best = Math.max(...hours);
  if (best <= 0) return null;
  const days = HEATMAP_DAYS.map((day) => ({ day, total: activity.heatmap[day.index]?.reduce((a, b) => a + b, 0) ?? 0 }));
  const busiestDay = days.reduce((a, b) => (b.total > a.total ? b : a));
  return { hour: hours.indexOf(best), day: busiestDay.day.label };
}

/** Daily points grouped into weeks when the range is long, so bars stay readable. */
export function activitySeries(
  activity: InsightsActivity,
  range: InsightsRange,
): { key: string; label: string; minutes: number }[] {
  if (range === "30d") {
    return activity.daily.map((point) => ({ key: point.date, label: formatDayShort(point.date), minutes: point.minutes }));
  }
  const size = range === "90d" ? 7 : 30;
  const buckets: { key: string; label: string; minutes: number }[] = [];
  for (let start = 0; start < activity.daily.length; start += size) {
    const slice = activity.daily.slice(start, start + size);
    if (!slice.length) continue;
    buckets.push({
      key: slice[0].date,
      label: formatDayShort(slice[0].date),
      minutes: slice.reduce((sum, point) => sum + point.minutes, 0),
    });
  }
  return buckets;
}
