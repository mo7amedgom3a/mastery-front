/**
 * Government-portal workflow engine: services with prerequisites, processing days and fees.
 * Submitting a service before its prerequisites are approved gets it rejected (a notice and a
 * day penalty); approved services run in parallel, so "days to operate" is the critical path.
 */

export type PortalService = {
  id: string;
  agency: string;
  label: string;
  /** Services that must be approved first. */
  after: readonly string[];
  days: number;
  /** Indicative government fees (SAR). */
  fee: number;
  /** Required before the company can trade and hire. */
  required: boolean;
  /** What the rejection notice says when submitted too early. */
  rejection: string;
  /** What the learner gets on approval. */
  output: string;
};

export const REJECTION_DAYS = 2;

export type PortalLog = { id: string; status: "approved" | "rejected"; missing: string[] }[];

export type PortalState = {
  approved: string[];
  log: PortalLog;
  /** Extra days added to a service by rejections or a returned application. */
  delays: Record<string, number>;
};

export const startPortal = (): PortalState => ({ approved: [], log: [], delays: {} });

export function missingFor(services: readonly PortalService[], state: PortalState, id: string): string[] {
  const service = services.find((s) => s.id === id);
  if (!service) return [];
  return service.after.filter((dep) => !state.approved.includes(dep));
}

export function submit(services: readonly PortalService[], state: PortalState, id: string): PortalState {
  if (state.approved.includes(id)) return state;
  const missing = missingFor(services, state, id);
  if (missing.length) {
    return {
      ...state,
      log: [...state.log, { id, status: "rejected", missing }],
      delays: { ...state.delays, [id]: (state.delays[id] ?? 0) + REJECTION_DAYS },
    };
  }
  return { ...state, approved: [...state.approved, id], log: [...state.log, { id, status: "approved", missing: [] }] };
}

/** Adds days to a service (e.g. an application returned for correction). */
export function delay(state: PortalState, id: string, days: number): PortalState {
  return { ...state, delays: { ...state.delays, [id]: (state.delays[id] ?? 0) + days } };
}

/** Earliest finish day of each approved service along its prerequisite chain. */
export function finishDays(services: readonly PortalService[], state: PortalState): Record<string, number> {
  const memo: Record<string, number> = {};
  const finish = (id: string): number => {
    if (memo[id] !== undefined) return memo[id];
    const service = services.find((s) => s.id === id);
    if (!service) return 0;
    const start = Math.max(0, ...service.after.map(finish));
    memo[id] = start + service.days + (state.delays[id] ?? 0);
    return memo[id];
  };
  for (const id of state.approved) finish(id);
  return memo;
}

export type PortalSummary = { days: number; fees: number; rejections: number; missingRequired: string[] };

export function summarize(services: readonly PortalService[], state: PortalState): PortalSummary {
  const finish = finishDays(services, state);
  const days = Math.max(0, ...state.approved.map((id) => finish[id] ?? 0));
  const fees = state.approved.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.fee ?? 0), 0);
  return {
    days,
    fees,
    rejections: state.log.filter((entry) => entry.status === "rejected").length,
    missingRequired: services.filter((s) => s.required && !state.approved.includes(s.id)).map((s) => s.id),
  };
}

/** A valid submission order (topological), used by tests and the debrief's "ideal path". */
export function idealOrder(services: readonly PortalService[]): string[] {
  const order: string[] = [];
  const visit = (id: string) => {
    if (order.includes(id)) return;
    const service = services.find((s) => s.id === id);
    service?.after.forEach(visit);
    order.push(id);
  };
  services.filter((s) => s.required).forEach((s) => visit(s.id));
  return order;
}
