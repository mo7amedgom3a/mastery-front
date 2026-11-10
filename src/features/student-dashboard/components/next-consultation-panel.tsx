"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { JoinPanel } from "@/features/consultations/components/session-actions";
import { bookingStatus, isUpcoming } from "@/features/consultations/model/status";
import { StatusTag } from "@/features/orders/components/status-tag";
import { consultationQueries, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime, formatDayNumber, formatMonthShort, formatNumber } from "@/lib/format";

import { DashboardPanel } from "./dashboard-panel";

/** The demo's «موعدك القادم» card, fed by the real bookings API. */
export function NextConsultationPanel() {
  const bookings = useQuery({ ...consultationQueries.myBookings(), refetchInterval: 60_000 });
  const next = bookings.data
    ?.filter((booking) => isUpcoming(booking.status) && booking.scheduled_start_at)
    .toSorted((a, b) => (a.scheduled_start_at ?? "").localeCompare(b.scheduled_start_at ?? ""))[0];

  return (
    <DashboardPanel
      id="next-consultation-title"
      title="موعدك القادم"
      action={
        <AppLink href={routes.studentConsultations} className="ma-btn ma-btn--ghost ma-btn--sm">
          كل الاستشارات
        </AppLink>
      }
    >
      {bookings.isPending ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">جارٍ تحميل موعدك…</span>
          <Skeleton className="h-20" />
        </div>
      ) : bookings.isError ? (
        <p className="m-0 text-sm text-fg-muted">تعذّر تحميل موعدك القادم.</p>
      ) : !next ? (
        <div className="flex flex-col items-start gap-3">
          <p className="m-0 text-sm text-fg-muted">لا يوجد موعد استشارة قادم.</p>
          <ButtonLink href={routes.search} variant="soft" size="sm">
            تصفّح الاستشارات
          </ButtonLink>
        </div>
      ) : (
        <ConsultationSummary booking={next} />
      )}
    </DashboardPanel>
  );
}

function ConsultationSummary({ booking }: { booking: ConsultationBooking }) {
  const status = bookingStatus(booking.status);
  const canJoin = booking.status === "confirmed" || booking.status === "in_progress";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3.5">
        <span className="flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-photo bg-accent leading-none text-ink">
          <b className="text-xl leading-none tabular-nums">
            {booking.scheduled_start_at ? formatDayNumber(booking.scheduled_start_at) : "—"}
          </b>
          <span className="mt-1 text-[11px] leading-none">
            {booking.scheduled_start_at ? formatMonthShort(booking.scheduled_start_at) : ""}
          </span>
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <StatusTag status={status} />
          <AppLink
            href={routes.studentConsultation(booking.booking_id)}
            className="line-clamp-2 font-bold hover:underline"
          >
            {booking.product_title ?? "استشارة"}
          </AppLink>
          <span className="text-sm text-fg-muted">مع {booking.expert_name ?? "الخبير"}</span>
          <span className="flex items-center gap-1.5 text-sm text-fg-muted">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
            {booking.scheduled_start_at ? formatDateTime(booking.scheduled_start_at) : "—"}
            {booking.duration_minutes ? ` · ${formatNumber(booking.duration_minutes)} دقيقة` : null}
          </span>
        </div>
      </div>

      {canJoin ? (
        <JoinPanel booking={booking} />
      ) : (
        <ButtonLink href={routes.studentConsultation(booking.booking_id)} variant="primary" block>
          تفاصيل الموعد
        </ButtonLink>
      )}
    </div>
  );
}
