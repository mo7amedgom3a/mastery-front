import { BookOpenCheck, CalendarRange, CheckSquare, GraduationCap, MessagesSquare, Radio, StickyNote, type LucideIcon } from "lucide-react";

import type { PlannerEvent, PlannerEventSource, PlannerRange } from "@/lib/api/planner";

/** Local calendar-day key, e.g. "2026-11-09" (the student's own timezone). */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight of a day key. */
export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** The visible month plus a week each side (outside days, ranges that spill over); under 62 days. */
export function monthWindow(month: Date): PlannerRange {
  const start = addDays(monthStart(month), -7);
  const end = addDays(new Date(month.getFullYear(), month.getMonth() + 1, 1), 7);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** From local midnight today, `days` days ahead. */
export function upcomingWindow(days: number, now = new Date()): PlannerRange {
  const start = dateFromKey(dayKey(now));
  return { from: start.toISOString(), to: addDays(start, days).toISOString() };
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Riyadh";
  } catch {
    return "Asia/Riyadh";
  }
}

/** "HH:MM" of a date in local time, for `<input type="time">`. */
export function timeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** A local day key + "HH:MM" as a Date. */
export function combine(key: string, time: string): Date {
  const date = dateFromKey(key);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export type SourceMeta = {
  label: string;
  icon: LucideIcon;
  /** Background of the dot/stripe; every source also has its own icon so colour is never the only cue. */
  swatch: string;
};

export const SOURCE_META: Record<PlannerEventSource, SourceMeta> = {
  note: { label: "ملاحظة", icon: StickyNote, swatch: "bg-yellow" },
  todo: { label: "مهمة", icon: CheckSquare, swatch: "bg-green" },
  study: { label: "وقت تعلّم", icon: BookOpenCheck, swatch: "bg-sky" },
  plan: { label: "خطة تعلّم", icon: CalendarRange, swatch: "bg-lilac" },
  live_cohort: {
    label: "دبلومة مباشرة",
    icon: GraduationCap,
    swatch: "bg-coral",
  },
  live_session: { label: "محاضرة مباشرة", icon: Radio, swatch: "bg-coral" },
  consultation: { label: "استشارة", icon: MessagesSquare, swatch: "bg-pink" },
};

/** Sources the filter chips toggle (a cohort range travels with its sessions). */
export const FILTERS = [
  { key: "mine", label: "ملاحظاتي ومهامي", sources: ["note", "todo", "study"] },
  { key: "plans", label: "الخطط", sources: ["plan"] },
  {
    key: "live",
    label: "الدبلومات المباشرة",
    sources: ["live_cohort", "live_session"],
  },
  { key: "consultations", label: "الاستشارات", sources: ["consultation"] },
] as const satisfies readonly {
  key: string;
  label: string;
  sources: readonly PlannerEventSource[];
}[];

export type FilterKey = (typeof FILTERS)[number]["key"];

export function visibleSources(enabled: ReadonlySet<FilterKey>): Set<PlannerEventSource> {
  return new Set(FILTERS.filter((f) => enabled.has(f.key)).flatMap((f) => f.sources));
}

/** First and last local day an event covers. Plans are whole local days sent as dates. */
export function eventDays(event: PlannerEvent): [string, string] {
  if (event.source === "plan") {
    const extra = event.extra as { starts_on?: string; ends_on?: string };
    if (extra.starts_on && extra.ends_on) return [extra.starts_on, extra.ends_on];
  }
  const start = new Date(event.starts_at);
  if (!event.ends_at) return [dayKey(start), dayKey(start)];
  // An end exactly at midnight belongs to the previous day.
  const end = new Date(new Date(event.ends_at).getTime() - 1);
  const last = end < start ? start : end;
  return [dayKey(start), dayKey(last)];
}

/** Whether the event is a range across several days (shown as a band, not a dot per day). */
export function isRange(event: PlannerEvent): boolean {
  const [first, last] = eventDays(event);
  return first !== last;
}

/** Events per local day; a range lands on every day it covers. */
export function groupByDay(events: readonly PlannerEvent[]): Map<string, PlannerEvent[]> {
  const days = new Map<string, PlannerEvent[]>();
  for (const event of events) {
    const [first, last] = eventDays(event);
    let cursor = dateFromKey(first);
    const stop = dateFromKey(last);
    for (let guard = 0; cursor <= stop && guard < 400; guard += 1) {
      const key = dayKey(cursor);
      const list = days.get(key) ?? [];
      list.push(event);
      days.set(key, list);
      cursor = addDays(cursor, 1);
    }
  }
  return days;
}

/** Day agenda order: ranges and all-day entries first, then by start time. */
export function agendaOrder(a: PlannerEvent, b: PlannerEvent): number {
  const rank = (e: PlannerEvent) => (isRange(e) ? 0 : e.all_day ? 1 : 2);
  return rank(a) - rank(b) || a.starts_at.localeCompare(b.starts_at) || a.title.localeCompare(b.title);
}

export const REMINDER_OPTIONS: readonly {
  value: number | null;
  label: string;
}[] = [
  { value: null, label: "بدون تذكير" },
  { value: 0, label: "في الموعد" },
  { value: 15, label: "قبل 15 دقيقة" },
  { value: 60, label: "قبل ساعة" },
  { value: 1440, label: "قبل يوم" },
  { value: 10080, label: "قبل أسبوع" },
];

export const PLAN_COLORS = ["lilac", "sky", "green", "yellow", "pink", "teal"] as const;
export type PlanColor = (typeof PLAN_COLORS)[number];

export function planSwatch(color: string | null | undefined): string {
  const known: Record<PlanColor, string> = {
    lilac: "bg-lilac",
    sky: "bg-sky",
    green: "bg-green",
    yellow: "bg-yellow",
    pink: "bg-pink",
    teal: "bg-teal",
  };
  return known[(color ?? "lilac") as PlanColor] ?? "bg-lilac";
}
