import type { AvailabilityVM, SlotVM } from "./types";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** Share of slots shown as already booked, until the booking API reports real ones. */
const TAKEN_RATIO = 0.25;

/** sessionStorage key where a guest's chosen slot waits while they sign in. */
export function pendingSlotKey(consultationId: number): string {
  return `consultation-booking:${consultationId}`;
}

/** Calendar-day key in the visitor's own timezone, e.g. "2026-10-03". */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Stable 0–1 value for a string (FNV-1a), so the same slot is "taken" on every visit. */
function hashUnit(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0xffffffff;
}

/**
 * Every slot from now to the horizon, grouped by the visitor's local day and sorted by time.
 * Weekly windows are wall-clock times at the availability's UTC offset; each is cut into
 * `slotMinutes` starts. Runs in the browser: "now" must never be frozen into cached HTML.
 *
 * MOCK: which slots are taken is a stable pseudo-random pick per (consultation, start).
 * TODO(api): take booked starts from the booking API instead.
 */
export function buildSlots(availability: AvailabilityVM, consultationId: number, now: Date): Map<string, SlotVM[]> {
  const { utcOffsetMinutes, slotMinutes, minNoticeHours, horizonDays, windows } = availability;
  const days = new Map<string, SlotVM[]>();
  if (slotMinutes <= 0) {
    return days;
  }
  const offset = utcOffsetMinutes * MINUTE;
  const earliest = now.getTime() + minNoticeHours * 60 * MINUTE;
  const latest = now.getTime() + horizonDays * DAY;
  // Midnight of "today" on the availability's own clock, as a UTC-based timestamp.
  const today = Math.floor((now.getTime() + offset) / DAY) * DAY;

  for (let index = 0; index <= horizonDays + 1; index++) {
    const midnight = today + index * DAY;
    const weekday = new Date(midnight).getUTCDay();
    for (const window of windows) {
      if (window.weekday !== weekday) continue;
      for (let minute = window.startMinute; minute + slotMinutes <= window.endMinute; minute += slotMinutes) {
        const start = midnight + minute * MINUTE - offset;
        if (start < earliest || start > latest) continue;
        const date = new Date(start);
        const iso = date.toISOString();
        const key = dayKey(date);
        const slots = days.get(key) ?? [];
        slots.push({ start: iso, taken: hashUnit(`${consultationId}:${iso}`) < TAKEN_RATIO });
        days.set(key, slots);
      }
    }
  }
  for (const slots of days.values()) {
    slots.sort((a, b) => a.start.localeCompare(b.start));
  }
  return days;
}
