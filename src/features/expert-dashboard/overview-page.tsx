"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MessagesSquare } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { BookingRow } from "@/features/consultations/consultations-page";
import { consultationQueries } from "@/lib/api/consultations";
import { formatNumber } from "@/lib/format";

import { ApprovalCard } from "./components/approval-card";

/** Today's view: what needs a decision, the next session, and this month in numbers. */
export function ExpertOverviewPage() {
  const summary = useQuery({ ...consultationQueries.expertSummary(), refetchInterval: 30_000 });
  const pending = useQuery({
    ...consultationQueries.expertBookings({ status: ["awaiting_approval"], limit: 20 }),
    refetchInterval: 20_000,
  });
  const profile = useQuery(consultationQueries.expert());

  return (
    <div className="flex flex-col gap-10">
      {summary.isPending ? (
        <Skeleton className="h-24" />
      ) : summary.isSuccess ? (
        <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile term="بانتظار موافقتك" value={summary.data.pending_approvals} />
          <Tile term="جلسات قادمة" value={summary.data.upcoming_sessions} />
          <Tile term="مكتملة هذا الشهر" value={summary.data.completed_this_month} />
          <Tile term="قيد الاسترداد" value={summary.data.refunds_pending} />
        </dl>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="expert-next">
        <h2 id="expert-next" className="m-0 text-lg font-bold">
          الجلسة القادمة
        </h2>
        {summary.data?.next_booking ? (
          <BookingRow booking={summary.data.next_booking} href={routes.expertBooking(summary.data.next_booking.booking_id)} />
        ) : summary.isSuccess ? (
          <p className="m-0 text-sm text-fg-muted">لا توجد جلسات قادمة.</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="expert-pending">
        <h2 id="expert-pending" className="m-0 text-lg font-bold">
          بانتظار موافقتك
        </h2>
        {pending.isPending ? <Skeleton className="h-28" /> : null}
        {pending.isSuccess && pending.data.items.length === 0 ? (
          <p className="m-0 text-sm text-fg-muted">لا توجد طلبات جديدة.</p>
        ) : null}
        {pending.isSuccess && pending.data.items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {pending.data.items.map((booking) => (
              <li key={booking.booking_id}>
                <ApprovalCard booking={booking} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {profile.isSuccess && (profile.data.services_count === 0 || profile.data.slots_upcoming === 0) ? (
        <section className="flex flex-col gap-3 rounded-panel border border-line p-5" aria-labelledby="expert-setup">
          <h2 id="expert-setup" className="m-0 text-lg font-bold">
            جهّز صفحتك لاستقبال الحجوزات
          </h2>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            {profile.data.services_count === 0
              ? "أضف استشارة واحدة على الأقل بسعرها، ثم افتح مواعيد في التقويم ليتمكّن العملاء من الحجز."
              : "لا توجد مواعيد قادمة مفتوحة للحجز. افتح مواعيد في التقويم."}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.data.services_count === 0 ? (
              <ButtonLink href={routes.expertServices} variant="primary" size="sm" className="gap-2">
                <MessagesSquare aria-hidden="true" className="size-4" />
                إضافة استشارة
              </ButtonLink>
            ) : null}
            <ButtonLink href={routes.expertCalendar} variant="soft" size="sm" className="gap-2">
              <CalendarDays aria-hidden="true" className="size-4" />
              فتح مواعيد
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Tile({ term, value }: { term: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-panel border border-line-strong bg-surface p-4">
      <dt className="text-sm text-fg-muted">{term}</dt>
      <dd className="m-0 text-3xl font-bold tabular-nums">{formatNumber(value)}</dd>
    </div>
  );
}
