import type { AvailableSlot } from "@/lib/api/consultations";

import type { SlotVM } from "./types";

/** sessionStorage key where a guest's chosen slot waits while they sign in. */
export function pendingSlotKey(consultationId: number): string {
  return `consultation-booking:${consultationId}`;
}

/** The B2C catalog product of a legacy consultation: its slug is `consultation-<legacy id>`. */
export function consultationProductRef(consultationId: number): string {
  return `consultation-${consultationId}`;
}

/** Calendar-day key in the visitor's own timezone, e.g. "2026-10-03". */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Free slots from the API, grouped by the visitor's local day and sorted by time. */
export function groupSlotsByDay(slots: readonly AvailableSlot[]): Map<string, SlotVM[]> {
  const days = new Map<string, SlotVM[]>();
  for (const slot of slots) {
    if (!slot.is_available) continue;
    const start = new Date(slot.starts_at);
    const key = dayKey(start);
    const list = days.get(key) ?? [];
    list.push({ id: slot.slot_id, start: start.toISOString(), end: new Date(slot.ends_at).toISOString() });
    days.set(key, list);
  }
  for (const list of days.values()) list.sort((a, b) => a.start.localeCompare(b.start));
  return new Map([...days].sort(([a], [b]) => a.localeCompare(b)));
}

/** Where a slot starting at `start` (ISO) sits: its day key and id, e.g. to restore a guest's pick. */
export function findSlotByStart(days: ReadonlyMap<string, readonly SlotVM[]>, start: string): { key: string; id: string } | null {
  for (const [key, slots] of days) {
    const slot = slots.find((candidate) => candidate.start === start);
    if (slot) return { key, id: slot.id };
  }
  return null;
}

/**
 * The slots a booking of `count` back-to-back sessions starting at `startId` would hold, or null
 * when the expert is not free for all of them (a multi-hour booking needs consecutive slots).
 */
export function consecutiveRun(slots: readonly SlotVM[], startId: string, count: number): SlotVM[] | null {
  const first = slots.findIndex((slot) => slot.id === startId);
  if (first < 0) return null;
  const run = [slots[first]];
  for (let index = first + 1; run.length < count && index < slots.length; index++) {
    if (Date.parse(slots[index].start) !== Date.parse(run.at(-1)!.end)) break;
    run.push(slots[index]);
  }
  return run.length === count ? run : null;
}

/** How many back-to-back sessions can start at `startId` (at least 1, at most `max`). */
export function maxRunLength(slots: readonly SlotVM[], startId: string, max: number): number {
  let length = 1;
  while (length < max && consecutiveRun(slots, startId, length + 1)) length += 1;
  return length;
}
