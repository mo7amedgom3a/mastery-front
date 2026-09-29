import { formatPrice } from "@/lib/format";

/** What a card shows in its price slot. */
export type Pricing = {
  /** What the learner pays now, formatted. Null when the price is unknown or free. */
  current: string | null;
  /** Pre-offer price, formatted; set only while an offer undercuts it. Rendered struck through. */
  original: string | null;
  /** An explicit zero price: shown as "مجاني" with an enrol action instead of the cart. */
  free: boolean;
};

export const noPricing: Pricing = { current: null, original: null, free: false };

/**
 * `current` must come from a real price row: only an explicit `0` means free. A missing price
 * (null/undefined) stays unknown, so legacy placeholder zeros must be dropped before calling this.
 */
export function toPricing(current: number | null | undefined, original?: number | null): Pricing {
  if (current === null || current === undefined || !Number.isFinite(current) || current < 0) {
    return noPricing;
  }
  const struck = original && original > current ? formatPrice(original) : null;
  if (current === 0) {
    return { current: null, original: struck, free: true };
  }
  return { current: formatPrice(current), original: struck, free: false };
}

/** One row of a legacy price list (`prices[]` on a course, `/legacy/courses/{id}/prices`). */
export type PriceRow = {
  id: number;
  price: number;
  name?: string | null;
  active?: boolean | null;
  is_main?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

/** Legacy timestamps carry no zone; they are read as UTC. */
function parseLegacyDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isFinite(time) ? time : null;
}

/**
 * The price row that applies now, and the base price it undercuts.
 * - The main row (`is_main`) is the base price whatever its dates say: legacy data often stores a
 *   past, zero-length window on it (e.g. starts_at = ends_at = 2020-12-04), which must not hide it.
 * - Other active rows are offers, valid only inside their window (open ends allowed); the cheapest
 *   running offer wins, and only when it is below the base price.
 * - With no main row, the cheapest running row is the price.
 */
export function resolvePriceRows<T extends PriceRow>(
  rows: readonly T[] | null | undefined,
  now: number = Date.now(),
): { current: T | null; original: number | null } {
  const active = (rows ?? []).filter((row) => row.active !== false && Number.isFinite(row.price) && row.price >= 0);
  const main = active.find((row) => row.is_main) ?? null;
  const running = active.filter((row) => {
    if (row === main) return false;
    const start = parseLegacyDate(row.starts_at);
    const end = parseLegacyDate(row.ends_at);
    return (start === null || start <= now) && (end === null || now < end);
  });
  const offer = running.reduce<T | null>((best, row) => (!best || row.price < best.price ? row : best), null);

  if (main && offer && offer.price < main.price) {
    return { current: offer, original: main.price };
  }
  return { current: main ?? offer, original: null };
}
