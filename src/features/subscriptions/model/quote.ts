import type { PlanVM } from "./plans";

/** What a team checkout charges per billing period, in cents (the same rounding as the backend and Stripe). */
export type SeatQuote = {
  seats: number;
  unitMinor: number;
  subtotalMinor: number;
  taxPercent: number;
  taxMinor: number;
  totalMinor: number;
};

/** A team size inside the plan's range (`minSeats`–`maxSeats`). */
export function clampSeats(plan: Pick<PlanVM, "minSeats" | "maxSeats">, seats: number): number {
  if (!Number.isFinite(seats)) return plan.minSeats;
  return Math.min(plan.maxSeats, Math.max(plan.minSeats, Math.round(seats)));
}

/** Seats × price per employee, plus VAT on that subtotal. Mirrors `seat_quote` in the backend. */
export function quoteFor(plan: Pick<PlanVM, "amount" | "taxPercent">, seats: number): SeatQuote {
  const unitMinor = Math.round(plan.amount * 100);
  const subtotalMinor = unitMinor * seats;
  const taxMinor = Math.round((subtotalMinor * plan.taxPercent) / 100);
  return { seats, unitMinor, subtotalMinor, taxPercent: plan.taxPercent, taxMinor, totalMinor: subtotalMinor + taxMinor };
}
