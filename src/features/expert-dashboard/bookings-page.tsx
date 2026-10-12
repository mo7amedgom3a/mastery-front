"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { BookingRow } from "@/features/consultations/consultations-page";
import { consultationQueries, type ExpertBookingsParams } from "@/lib/api/consultations";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: "", label: "كل الحالات", statuses: undefined },
  { value: "awaiting", label: "بانتظار موافقتك", statuses: ["awaiting_approval"] },
  { value: "upcoming", label: "مؤكّدة / جارية", statuses: ["confirmed", "in_progress"] },
  { value: "completed", label: "مكتملة", statuses: ["completed"] },
  { value: "refunds", label: "قيد الاسترداد / غياب الخبير", statuses: ["refund_pending", "no_show_expert"] },
  { value: "no_show", label: "غياب العميل", statuses: ["no_show_customer"] },
] as const;

/** A local date input value as the instant its day starts. */
function dayStart(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

/** Every paid booking, newest first, filtered by status, consultation and date. */
export function ExpertBookingsPage() {
  const ids = { status: useId(), service: useId(), from: useId(), to: useId() };
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const services = useQuery(consultationQueries.expertServices());

  const statuses = STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.statuses;
  const toDay = to ? new Date(new Date(`${to}T00:00:00`).getTime() + 86_400_000).toISOString() : undefined;
  const params: ExpertBookingsParams = {
    status: statuses ? [...statuses] : undefined,
    service_id: serviceId || undefined,
    from: dayStart(from),
    to: toDay,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  const bookings = useQuery({
    ...consultationQueries.expertBookings(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const total = bookings.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-panel border border-line p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.status} className="text-sm font-bold">
            الحالة
          </label>
          <select
            id={ids.status}
            value={statusFilter}
            onChange={(event) => filter(setStatusFilter)(event.target.value)}
            className="rounded-panel border border-line bg-surface p-2"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.service} className="text-sm font-bold">
            الاستشارة
          </label>
          <select
            id={ids.service}
            value={serviceId}
            onChange={(event) => filter(setServiceId)(event.target.value)}
            className="max-w-64 rounded-panel border border-line bg-surface p-2"
          >
            <option value="">كل الاستشارات</option>
            {services.data?.map((service) => (
              <option key={service.service_id} value={service.service_id}>
                {service.title ?? service.slug}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.from} className="text-sm font-bold">
            من
          </label>
          <input
            id={ids.from}
            type="date"
            value={from}
            onChange={(event) => filter(setFrom)(event.target.value)}
            className="rounded-panel border border-line bg-surface p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.to} className="text-sm font-bold">
            إلى
          </label>
          <input
            id={ids.to}
            type="date"
            value={to}
            onChange={(event) => filter(setTo)(event.target.value)}
            className="rounded-panel border border-line bg-surface p-2"
          />
        </div>
      </div>

      {bookings.isPending ? <Skeleton className="h-40" /> : null}
      {bookings.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الحجوزات.</p> : null}
      {bookings.isSuccess && bookings.data.items.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">لا توجد حجوزات تطابق هذا البحث.</p>
      ) : null}
      {bookings.isSuccess && bookings.data.items.length > 0 ? (
        <>
          <p className="m-0 text-sm text-fg-muted" aria-live="polite">
            {formatNumber(total)} حجز
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {bookings.data.items.map((booking) => (
              <li key={booking.booking_id}>
                <BookingRow booking={booking} href={routes.expertBooking(booking.booking_id)} />
              </li>
            ))}
          </ul>
          {pages > 1 ? (
            <nav aria-label="صفحات الحجوزات" className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((value) => value - 1)}
                disabled={page === 0}
                className="ma-btn ma-btn--soft ma-btn--sm disabled:opacity-40"
              >
                السابق
              </button>
              <span className="text-sm tabular-nums">
                {formatNumber(page + 1)} / {formatNumber(pages)}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={page + 1 >= pages}
                className="ma-btn ma-btn--soft ma-btn--sm disabled:opacity-40"
              >
                التالي
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
