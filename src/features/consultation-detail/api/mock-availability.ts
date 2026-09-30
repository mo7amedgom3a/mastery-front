import type { AvailabilityVM, AvailabilityWindowVM } from "../model/types";

/** Riyadh time (UTC+3, no daylight saving): the clock the mock windows are written in. */
const UTC_OFFSET_MINUTES = 180;
const MIN_NOTICE_HOURS = 24;
const HORIZON_DAYS = 45;
const DEFAULT_SLOT_MINUTES = 60;

/** Weekday sets (0 = Sunday … 6 = Saturday) and daily windows the mock rotates through. */
const WEEKDAY_SETS: readonly (readonly number[])[] = [
  [0, 2, 4],
  [1, 3, 6],
  [0, 1, 3, 5],
  [2, 4, 6],
];
const DAY_WINDOWS: readonly (readonly [startHour: number, endHour: number][])[] = [
  [[17, 21]],
  [
    [10, 13],
    [18, 21],
  ],
  [[15, 20]],
];

/**
 * MOCK: weekly availability for a consultation, stable per id (no clock involved, so cached pages
 * never change between renders). It has the shape of the API's `available_slots` (a weekday plus a
 * from/to time window), so this is the only file to change when real availability is wired in.
 *
 * TODO(api): map `detail.available_slots` instead, once the backend defines which weekday `day`
 * counts from and which timezone `from`/`to` are in (`timezone` is null today).
 */
export function getConsultationAvailability(id: number, sessionMinutes: number): AvailabilityVM {
  const weekdays = WEEKDAY_SETS[id % WEEKDAY_SETS.length];
  const hours = DAY_WINDOWS[id % DAY_WINDOWS.length];
  const windows: AvailabilityWindowVM[] = weekdays.flatMap((weekday) =>
    hours.map(([start, end]) => ({ weekday, startMinute: start * 60, endMinute: end * 60 })),
  );
  return {
    utcOffsetMinutes: UTC_OFFSET_MINUTES,
    slotMinutes: sessionMinutes > 0 ? sessionMinutes : DEFAULT_SLOT_MINUTES,
    minNoticeHours: MIN_NOTICE_HOURS,
    horizonDays: HORIZON_DAYS,
    windows,
  };
}
