import { CalendarClock, CalendarDays, Clock, UserRound, Video } from "lucide-react";
import type { ReactNode } from "react";

import { actionsFor } from "@/components/shop/card-actions-for";

import { BookingButton } from "../components/booking-button";
import { sessionsLabel } from "../model/facts";
import type { BookingVM, ConsultationDetailVM } from "../model/types";

/** Price, the booking button, wishlist and what the consultation includes. Sticky on large screens. */
export function BookingCard({ consultation, share }: { consultation: ConsultationDetailVM; share?: ReactNode }) {
  const { price, expert } = consultation;
  const sessions = sessionsLabel(consultation.sessions);
  const booking: BookingVM = {
    id: consultation.id,
    title: consultation.title,
    href: consultation.href,
    price: consultation.price,
    sessions: consultation.sessions,
    sessionLength: consultation.sessionLength,
    availability: consultation.availability,
    expertName: expert?.name ?? null,
  };
  const facts = [
    sessions ? { icon: CalendarClock, label: sessions } : null,
    consultation.sessionLength ? { icon: Clock, label: `${consultation.sessionLength} لكل جلسة` } : null,
    { icon: Video, label: "اجتماع مرئي مباشر" },
    expert ? { icon: UserRound, label: `جلسة فردية مع ${expert.name}` } : null,
    { icon: CalendarDays, label: "تختار اليوم والوقت المناسبين لك" },
  ].filter((fact) => fact !== null);

  return (
    // `lg:short:` — beside the content on a short viewport, tighter spacing so the whole card fits.
    <aside aria-label="حجز الاستشارة" className="rounded-panel border border-line-strong bg-surface p-6 lg:short:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        {price.free ? (
          <span className="ma-tag ma-tag--green text-base font-bold">مجانية</span>
        ) : price.current ? (
          <span dir="ltr" className="text-4xl font-bold lg:short:text-3xl">
            {price.current}
          </span>
        ) : (
          <span className="text-lg font-bold">السعر متاح عند الحجز</span>
        )}
        {price.current && consultation.sessions > 1 && sessions ? (
          <span className="text-sm text-fg-muted">لـ{sessions}</span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2 lg:short:mt-4">
        <div className="min-w-0 flex-1">
          <BookingButton booking={booking} />
        </div>
        {/* Consultations can't go in the cart (they need a slot): this is the wishlist heart only. */}
        {actionsFor("consultation", {
          id: consultation.id,
          title: consultation.title,
          href: consultation.href,
          image: consultation.image,
          price: consultation.price,
          priceAmount: consultation.priceAmount,
        })}
      </div>
      {share ? <div className="mt-3">{share}</div> : null}

      <h2 className="m-0 mt-8 text-sm font-bold lg:short:mt-5">تشمل الاستشارة</h2>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 text-[15px] lg:short:gap-2">
        {facts.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-accent" />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
