import { CalendarDays, Check, Clock, FileText, MessageCircle, MonitorPlay } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

import { detailCopy, spotlightCopy } from "../content/copy";
import type { LiveTrainingDetailVM } from "../model/types";
import BookingActions from "./booking-actions";

/**
 * Price, schedule and the booking action. Sticky beside the content on large screens.
 *
 * The booking action (`BookingActions`) talks to the live-diploma backend: pick an open cohort and
 * pay, or join the waitlist when every cohort is full.
 */
export function BookingCard({ training, id }: { training: LiveTrainingDetailVM; id?: string }) {
  const schedule = [
    { icon: CalendarDays, label: training.sessions ? `${training.dateRange} (${training.sessions})` : training.dateRange },
    { icon: Clock, label: training.sessionTime },
    { icon: MonitorPlay, label: training.location },
  ];

  return (
    <aside id={id} aria-label={detailCopy.bookingLabel} className="rounded-panel border border-line-strong bg-surface p-6 lg:short:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        <span dir="ltr" className="text-4xl font-bold lg:short:text-3xl">
          {training.price.current}
        </span>
        {training.priceSar ? (
          <span className="text-sm text-fg-muted">
            أو {formatNumber(training.priceSar)} {spotlightCopy.sar}
          </span>
        ) : null}
      </div>
      <p className="m-0 mt-1 text-sm text-fg-muted">{detailCopy.priceNote}</p>

      <ul className="m-0 mt-5 grid list-none gap-3 border-y border-line p-0 py-5 text-[15px] lg:short:gap-2">
        {schedule.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-start gap-3">
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-3">
        <BookingActions catalogSlug={training.catalogSlug} priceLabel={training.price.current ?? ""} />
        {training.brochureUrl ? (
          <a
            href={training.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "soft", size: "sm", block: true })}
          >
            <FileText aria-hidden="true" className="size-4" />
            {detailCopy.brochure}
          </a>
        ) : null}
        {training.whatsappHref ? (
          <a
            href={training.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "ghost", size: "sm", block: true })}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            {detailCopy.whatsapp}
          </a>
        ) : null}
      </div>

      {training.highlights.length > 0 ? (
        <>
          <h2 className="m-0 mt-6 text-sm font-bold lg:short:mt-4">{detailCopy.includes}</h2>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[15px]">
            {training.highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check aria-hidden="true" className="size-5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}
