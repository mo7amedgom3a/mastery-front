"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/features/orders/components/status-tag";
import { ApiError } from "@/lib/api/client";
import { consultationQueries, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

import { JoinPanel, RecordingPlayer } from "./components/session-actions";
import { SessionAssets } from "./components/session-assets";
import { bookingStatus } from "./model/status";

const STATUS_NOTES: Record<string, string> = {
  awaiting_approval: "تم الدفع، وننتظر تأكيد الخبير للموعد. يصلك بريد فور التأكيد، وإن لم يؤكّده يُردّ المبلغ كاملاً.",
  confirmed: "الموعد مؤكّد. يُتاح الدخول قبل الموعد بخمس دقائق، وتنتهي الجلسة تلقائياً عند انتهاء المدة.",
  in_progress: "الجلسة جارية الآن.",
  refund_pending: "لم يُؤكَّد هذا الموعد، وسيُردّ المبلغ المدفوع كاملاً.",
  no_show_expert: "لم يحضر الخبير الجلسة، وسيُردّ المبلغ المدفوع كاملاً.",
  no_show_customer: "انتهت الجلسة دون حضورك. وفق الشروط لا يُردّ المبلغ عند غياب العميل.",
  completed: "اكتملت الجلسة. يمكنك مشاهدة تسجيلها أدناه متى شئت.",
};

/** Reasons the backend records itself; anything else is the expert's own words to the customer. */
const SYSTEM_REASONS = new Set(["approval_timeout", "rejected_by_expert", "cancelled_by_expert", "slot_unavailable_after_payment"]);

function statusNote(detail: ConsultationBooking): string | undefined {
  if (detail.status === "refund_pending" && detail.ended_reason === "cancelled_by_expert") {
    const message = detail.rejection_reason && !SYSTEM_REASONS.has(detail.rejection_reason) ? ` رسالته: «${detail.rejection_reason}».` : "";
    return `ألغى الخبير هذا الموعد.${message} سيُردّ المبلغ المدفوع كاملاً، ويمكنك حجز موعد آخر متى شئت.`;
  }
  return STATUS_NOTES[detail.status];
}

/** One consultation booking: its status, schedule, the way into the room and the recording. */
export function ConsultationPage({ bookingId }: { bookingId: string }) {
  const booking = useQuery({ ...consultationQueries.booking(bookingId), refetchInterval: 20_000 });

  if (booking.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">جارٍ تحميل الحجز…</span>
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (booking.isError) {
    const notFound = booking.error instanceof ApiError && booking.error.status === 404;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{notFound ? "لم نجد هذا الحجز" : "تعذّر تحميل الحجز"}</p>
          <p className="ma-alert__text">
            {notFound ? "قد يكون الرابط غير صحيح، أو الحجز مرتبطاً بحساب آخر." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
        </div>
      </div>
    );
  }

  const detail = booking.data;
  const note = statusNote(detail);
  return (
    <div className="flex flex-col gap-8">
      <dl className="m-0 grid gap-4 rounded-panel border border-line-strong bg-surface p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Fact term="الحالة">
          <StatusTag status={bookingStatus(detail.status)} />
        </Fact>
        <Fact term="الموعد">{detail.scheduled_start_at ? formatDateTime(detail.scheduled_start_at) : "—"}</Fact>
        <Fact term="المدة">{detail.duration_minutes ? `${detail.duration_minutes} دقيقة` : "—"}</Fact>
        <Fact term={detail.role === "expert" ? "العميل" : "الخبير"}>
          {(detail.role === "expert" ? detail.customer_name : detail.expert_name) ?? "—"}
        </Fact>
      </dl>

      {note ? (
        <div className="ma-alert ma-alert--info" role="status">
          <div>
            <p className="ma-alert__text">{note}</p>
          </div>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">{detail.product_title ?? "الاستشارة"}</h2>
        <JoinPanel booking={detail} />
        <RecordingPlayer booking={detail} />
        <SessionAssets booking={detail} />
        {detail.role === "customer" && !detail.recording_access ? (
          <p className="m-0 text-sm text-fg-muted">
            اخترت عند الحجز عدم الوصول إلى تسجيل هذه الجلسة، لذلك لا يظهر لك هنا.
          </p>
        ) : null}
      </section>
    </div>
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
