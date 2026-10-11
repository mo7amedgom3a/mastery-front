"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft } from "lucide-react";
import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/features/orders/components/status-tag";
import { routes } from "@/config/routes";
import { consultationQueries, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

import { JoinPanel } from "./components/session-actions";
import { bookingStatus, isUpcoming } from "./model/status";

/** The customer's consultations: upcoming first (with the join button), then past ones. */
export function ConsultationsPage() {
  const bookings = useQuery({ ...consultationQueries.myBookings(), refetchInterval: 30_000 });

  if (bookings.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ تحميل الاستشارات…</span>
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }
  if (bookings.isError) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر تحميل الاستشارات</p>
          <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
        </div>
      </div>
    );
  }
  if (bookings.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6">
        <CalendarClock aria-hidden="true" className="size-6 text-accent" />
        <p className="m-0 font-bold">لا توجد استشارات محجوزة بعد</p>
        <p className="m-0 text-sm leading-6 text-fg-muted">
          بعد الدفع يظهر الحجز هنا، ويصلك بريد عند تأكيد الخبير للموعد.
        </p>
        <ButtonLink href={routes.search} variant="soft">
          تصفّح الاستشارات
        </ButtonLink>
      </div>
    );
  }

  const upcoming = bookings.data.filter((booking) => isUpcoming(booking.status));
  const past = bookings.data.filter((booking) => !isUpcoming(booking.status));
  return (
    <div className="flex flex-col gap-10">
      {upcoming.length > 0 ? <BookingList title="القادمة" bookings={upcoming.toReversed()} /> : null}
      {past.length > 0 ? <BookingList title="السابقة" bookings={past} /> : null}
    </div>
  );
}

function BookingList({ title, bookings }: { title: string; bookings: ConsultationBooking[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-lg font-bold">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {bookings.map((booking) => (
          <li key={booking.booking_id}>
            <BookingRow booking={booking} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BookingRow({ booking, href }: { booking: ConsultationBooking; href?: Route }) {
  const link = href ?? routes.studentConsultation(booking.booking_id);
  const status = bookingStatus(booking.status);
  const counterpart = booking.role === "expert" ? booking.customer_name : booking.expert_name;
  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag status={status} />
          {booking.scheduled_start_at ? (
            <span className="text-sm text-fg-muted">{formatDateTime(booking.scheduled_start_at)}</span>
          ) : null}
        </div>
        <h3 className="m-0 text-base font-bold">
          <AppLink href={link} className="hover:underline">
            {booking.product_title ?? "استشارة"}
          </AppLink>
        </h3>
        <p className="m-0 text-sm text-fg-muted">
          {counterpart ? `${booking.role === "expert" ? "العميل" : "الخبير"}: ${counterpart} · ` : null}
          {booking.duration_minutes ? `${booking.duration_minutes} دقيقة` : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <JoinPanel booking={booking} />
        <AppLink
          href={link}
          aria-label="تفاصيل الحجز"
          className="ma-btn ma-btn--bare ma-btn--icon size-10 min-h-10"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </AppLink>
      </div>
    </article>
  );
}
