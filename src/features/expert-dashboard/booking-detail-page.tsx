"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { JoinPanel, RecordingPlayer } from "@/features/consultations/components/session-actions";
import { SessionAssets } from "@/features/consultations/components/session-assets";
import { bookingStatus } from "@/features/consultations/model/status";
import { StatusTag } from "@/features/orders/components/status-tag";
import { ApiError } from "@/lib/api/client";
import {
  cancelExpertBooking,
  consultationKeys,
  consultationQueries,
  type ExpertBookingDetail,
} from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

import { ApprovalCard } from "./components/approval-card";

const EVENT_LABELS: Record<string, string> = {
  booking_created: "بدأ العميل الحجز",
  paid: "تم الدفع",
  approved: "أكّدت الموعد",
  rejected: "اعتذرت عن الموعد",
  cancelled_by_expert: "ألغيت الحجز",
  manual_repair: "تصحيح من فريق ماستري",
};

function eventLabel(type: string): string {
  if (type.startsWith("finalized:")) return `انتهت الجلسة: ${bookingStatus(type.slice("finalized:".length)).label}`;
  return EVENT_LABELS[type] ?? type;
}

/** One booking for its expert: the customer's contact details, the session, the decision and the history. */
export function ExpertBookingDetailPage({ bookingId }: { bookingId: string }) {
  const detail = useQuery({ ...consultationQueries.expertBooking(bookingId), refetchInterval: 20_000 });

  if (detail.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">جارٍ تحميل الحجز…</span>
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (detail.isError) {
    const notFound = detail.error instanceof ApiError && detail.error.status === 404;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{notFound ? "لم نجد هذا الحجز" : "تعذّر تحميل الحجز"}</p>
          <p className="ma-alert__text">
            {notFound ? "قد يكون الرابط غير صحيح، أو الحجز لخبير آخر." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
        </div>
      </div>
    );
  }

  const { booking, customer, events } = detail.data;
  const startsInFuture = booking.scheduled_start_at ? Date.parse(booking.scheduled_start_at) > Date.parse(booking.server_now) : false;
  const cancellable =
    booking.status === "confirmed" && startsInFuture && !booking.customer_joined_at && !booking.expert_joined_at;

  return (
    <div className="flex flex-col gap-8">
      <dl className="m-0 grid gap-4 rounded-panel border border-line-strong bg-surface p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Fact term="الحالة">
          <StatusTag status={bookingStatus(booking.status)} />
        </Fact>
        <Fact term="الموعد">{booking.scheduled_start_at ? formatDateTime(booking.scheduled_start_at) : "—"}</Fact>
        <Fact term="المدة">{booking.duration_minutes ? `${booking.duration_minutes} دقيقة` : "—"}</Fact>
        <Fact term="الاستشارة">{booking.product_title ?? "—"}</Fact>
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="booking-customer">
        <h2 id="booking-customer" className="m-0 text-lg font-bold">
          العميل
        </h2>
        <div className="flex flex-col gap-2 rounded-panel border border-line p-5 text-sm">
          <p className="m-0 text-base font-bold">{customer.name ?? "—"}</p>
          <a href={`mailto:${customer.email}`} className="flex items-center gap-2 self-start" dir="ltr">
            <Mail aria-hidden="true" className="size-4 text-accent" />
            {customer.email}
          </a>
          {customer.phone ? (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 self-start" dir="ltr">
              <Phone aria-hidden="true" className="size-4 text-accent" />
              {customer.phone}
            </a>
          ) : null}
          {customer.country_code ? <p className="m-0 text-fg-muted">الدولة: {customer.country_code}</p> : null}
          {!booking.recording_access ? (
            <p className="m-0 text-fg-muted">اختار العميل عدم الوصول إلى التسجيل؛ التسجيل متاح لك ولفريق ماستري.</p>
          ) : null}
          {booking.rejection_reason && booking.status === "refund_pending" ? (
            <p className="m-0 text-fg-muted">السبب المسجّل: {booking.rejection_reason}</p>
          ) : null}
        </div>
      </section>

      {booking.status === "awaiting_approval" ? <ApprovalCard booking={booking} /> : null}

      <section className="flex flex-col gap-3" aria-labelledby="booking-session">
        <h2 id="booking-session" className="m-0 text-lg font-bold">
          الجلسة
        </h2>
        <JoinPanel booking={booking} />
        <RecordingPlayer booking={booking} />
        <SessionAssets booking={booking} />
        {cancellable ? <CancelBooking detail={detail.data} /> : null}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="booking-history">
        <h2 id="booking-history" className="m-0 text-lg font-bold">
          سجل الحجز
        </h2>
        <ol className="m-0 flex list-none flex-col gap-2 border-s border-line ps-4">
          {events.map((event, index) => (
            <li key={`${event.event_type}-${index}`} className="flex flex-col text-sm">
              <span className="font-bold">{eventLabel(event.event_type)}</span>
              <span className="text-fg-muted">{formatDateTime(event.created_at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CancelBooking({ detail }: { detail: ExpertBookingDetail }) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<"release" | "remove">("release");
  const cancel = useMutation({
    mutationFn: () => cancelExpertBooking(detail.booking.booking_id, { reason: reason.trim() || null, slots }),
    onSuccess: () => setOpen(false),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    cancel.mutate();
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="ma-btn ma-btn--soft ma-btn--sm self-start">
        إلغاء الحجز
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-panel border border-line p-4 text-sm">
      <p className="m-0 leading-6">سيُبلَّغ العميل بالبريد ويُردّ إليه المبلغ كاملاً.</p>
      <div className="flex flex-col gap-1">
        <label htmlFor={reasonId} className="font-bold">
          رسالة للعميل (اختياري)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          maxLength={500}
          rows={2}
          onChange={(event) => setReason(event.target.value)}
          className="rounded-panel border border-line bg-surface p-3"
        />
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 p-0 font-bold">بعد الإلغاء</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="after-cancel" checked={slots === "release"} onChange={() => setSlots("release")} />
          أتِح الوقت لعملاء آخرين
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="after-cancel" checked={slots === "remove"} onChange={() => setSlots("remove")} />
          احذف الوقت من تقويمي
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={cancel.isPending} className="ma-btn ma-btn--secondary ma-btn--sm disabled:opacity-50">
          تأكيد الإلغاء
        </button>
        <button type="button" onClick={() => setOpen(false)} className="ma-btn ma-btn--ghost ma-btn--sm">
          تراجع
        </button>
      </div>
      {cancel.isError ? (
        <p role="alert" className="m-0 text-fg-muted">
          لم يعد ممكناً إلغاء هذا الحجز: بدأت الجلسة أو تغيّرت حالته.
        </p>
      ) : null}
    </form>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-fg-muted">{term}</dt>
      <dd className="m-0 font-bold">{children}</dd>
    </div>
  );
}
