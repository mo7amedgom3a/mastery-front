"use client";

import { CalendarDays, LoaderCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { QueryProvider } from "@/components/providers/query-provider";
import { buttonClass } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { joinWaitlist, leaveWaitlist, liveDiplomaQueries, type Cohort } from "@/lib/api/live-diplomas";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";
import { cn } from "@/lib/cn";

import { detailCopy } from "../content/copy";

const LOCALE = "ar-u-nu-latn";

/** "5–10 أكتوبر 2026" in the cohort's own timezone. */
function formatCohortRange(cohort: Cohort): string {
  const formatter = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: cohort.timezone_name,
  });
  const start = new Date(cohort.starts_at);
  const end = new Date(cohort.ends_at);
  return end > start ? formatter.formatRange(start, end) : formatter.format(start);
}

type Props = {
  /** Backend live-diploma slug, resolved from the training's `catalog_slug`. */
  catalogSlug: string;
  /** The displayed seat price, e.g. "$520". */
  priceLabel: string;
};

/**
 * Live-diploma booking: every cohort with its seat availability, pick an open one and pay, or join
 * the waitlist when they are all closed or full. Self-contained — ships its own React Query client.
 */
export default function BookingActions(props: Props) {
  return (
    <QueryProvider>
      <BookingActionsInner {...props} />
    </QueryProvider>
  );
}

/** A cohort's seat bar: how many seats are still open out of its capacity. */
function CohortSeats({ cohort }: { cohort: Cohort }) {
  const capacity = cohort.seat_capacity;
  if (capacity <= 0) {
    return <p className="m-0 text-xs text-fg-muted">{detailCopy.cohort.capacityUnknown}</p>;
  }
  const remaining = Math.max(0, capacity - cohort.seats_taken);
  const ratio = remaining / capacity;
  const full = remaining === 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-medium tabular-nums", full ? "text-fg-muted" : "text-fg")}>
          {full ? detailCopy.cohort.closed : detailCopy.cohort.seatsLeft(remaining)}
        </span>
        <span className="tabular-nums text-fg-muted">{detailCopy.cohort.seatsOf(capacity)}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={cn("h-full rounded-full", full ? "bg-coral" : "bg-accent")}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function BookingActionsInner({ catalogSlug, priceLabel }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busyWaitlist, setBusyWaitlist] = useState(false);
  const checkout = useStartCheckout();

  useEffect(() => {
    let active = true;
    ensureAuthStatus()
      .then((ok) => active && setAuthed(ok))
      .catch(() => active && setAuthed(false));
    return () => {
      active = false;
    };
  }, []);

  const diploma = useQuery(liveDiplomaQueries.detail(catalogSlug));
  const waitlist = useQuery({ ...liveDiplomaQueries.myWaitlist(catalogSlug), enabled: authed === true });

  // Open cohorts first, then newest cohort number first.
  const cohorts = [...(diploma.data?.cohorts ?? [])].sort(
    (a, b) => Number(b.can_enroll) - Number(a.can_enroll) || b.cohort_number - a.cohort_number,
  );
  const waiting = waitlist.data?.status === "waiting";

  const reserve = (cohort: Cohort) => {
    if (!diploma.data) return;
    checkout.clearError();
    void checkout.start({ mode: "diploma", productId: diploma.data.product_id, cohortId: cohort.cohort_id });
  };

  const signIn = () => {
    window.location.assign(routes.loginThen(window.location.pathname));
  };

  const join = async () => {
    setJoinError(null);
    if (!(await ensureAuthStatus())) {
      signIn();
      return;
    }
    setBusyWaitlist(true);
    try {
      await joinWaitlist(catalogSlug, {});
      await waitlist.refetch();
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "تعذّر التسجيل في قائمة الانتظار.");
    } finally {
      setBusyWaitlist(false);
    }
  };

  const leave = async () => {
    setJoinError(null);
    setBusyWaitlist(true);
    try {
      await leaveWaitlist(catalogSlug);
      await waitlist.refetch();
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "تعذّر إلغاء الاشتراك.");
    } finally {
      setBusyWaitlist(false);
    }
  };

  if (diploma.isPending) {
    return (
      <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        {detailCopy.cohort.heading}…
      </p>
    );
  }

  // A missing diploma (slug not in the catalog) falls back to the page's own CTA: nothing to book.
  if (diploma.isError || !diploma.data) return null;

  return (
    <div className="flex flex-col gap-3">
      {cohorts.length > 0 ? (
        <div>
          <p className="m-0 text-sm font-medium">{detailCopy.cohort.heading}</p>
          <ul className="m-0 mt-2 grid list-none gap-2 p-0">
            {cohorts.map((cohort) => {
              const status = detailCopy.cohort.status[cohort.status] ?? cohort.status;
              const title = cohort.title ?? `${detailCopy.cohort.label} ${cohort.cohort_number}`;
              return (
                <li key={cohort.cohort_id} className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-medium leading-6">{title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                        cohort.can_enroll ? "bg-success/15 text-success" : "bg-surface-alt text-fg-muted",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="m-0 flex items-center gap-1.5 text-xs text-fg-muted">
                    <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                    {formatCohortRange(cohort)}
                  </p>
                  <CohortSeats cohort={cohort} />
                  {cohort.can_enroll ? (
                    <button
                      type="button"
                      onClick={() => reserve(cohort)}
                      disabled={checkout.busy}
                      className={buttonClass({ variant: "primary", size: "sm", block: true })}
                    >
                      {checkout.busy ? "جارٍ تجهيز الدفع…" : `${detailCopy.cohort.reserve} — ${priceLabel}`}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="m-0 flex items-center gap-2 text-[15px]">
          <Users aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
          {detailCopy.cohort.closed}
        </p>
      )}

      {!cohorts.some((cohort) => cohort.can_enroll) ? (
        <button type="button" onClick={join} disabled={busyWaitlist} className={buttonClass({ variant: "primary", block: true })}>
          {busyWaitlist ? detailCopy.cohort.joining : detailCopy.cohort.waitlist}
        </button>
      ) : null}

      {waiting ? (
        <div className="rounded-panel border border-line bg-surface-alt p-3 text-sm">
          <p className="m-0 font-medium">{detailCopy.cohort.onWaitlist}</p>
          <p className="m-0 mt-1 text-fg-muted">{detailCopy.cohort.onWaitlistLead}</p>
          <button type="button" onClick={leave} disabled={busyWaitlist} className="ma-btn ma-btn--soft ma-btn--sm mt-3">
            {busyWaitlist ? detailCopy.cohort.leaving : detailCopy.cohort.leaveWaitlist}
          </button>
        </div>
      ) : null}

      {checkout.error ? (
        <p role="alert" className={cn("m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium")}>
          {checkout.error}
        </p>
      ) : null}
      {joinError ? (
        <p role="alert" className={cn("m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium")}>
          {joinError}
        </p>
      ) : null}
    </div>
  );
}
