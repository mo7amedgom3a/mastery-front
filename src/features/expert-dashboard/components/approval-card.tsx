"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useId, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { approveBooking, consultationKeys, rejectBooking, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

/** A paid booking waiting for the expert: approve it, or decline with an optional reason (refunded). */
export function ApprovalCard({ booking }: { booking: ConsultationBooking }) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reasonId = useId();
  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      approve ? approveBooking(booking.booking_id) : rejectBooking(booking.booking_id, reason.trim() || null),
    onSettled: () => {
      // The workflow applies the decision within moments; refresh shortly after.
      setTimeout(() => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }), 1500);
    },
  });

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-base font-bold">
          <AppLink href={routes.expertBooking(booking.booking_id)} className="hover:underline">
            {booking.product_title ?? "استشارة"}
          </AppLink>
        </h3>
        <p className="m-0 text-sm text-fg-muted">
          {booking.customer_name ? `${booking.customer_name} · ` : null}
          {booking.scheduled_start_at ? formatDateTime(booking.scheduled_start_at) : null}
          {booking.duration_minutes ? ` · ${booking.duration_minutes} دقيقة` : null}
        </p>
        {booking.approval_deadline_at ? (
          <p className="m-0 text-xs text-fg-muted">
            يُلغى الحجز ويُردّ المبلغ للعميل إن لم تؤكّده قبل {formatDateTime(booking.approval_deadline_at)}.
          </p>
        ) : null}
      </div>
      {decide.isSuccess ? (
        <p role="status" className="m-0 text-sm font-bold">
          تم إرسال قرارك.
        </p>
      ) : rejecting ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={reasonId} className="text-sm font-bold">
            سبب الاعتذار (اختياري)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            className="rounded-panel border border-line bg-surface p-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide.mutate(false)}
              disabled={decide.isPending}
              className="ma-btn ma-btn--secondary ma-btn--sm disabled:opacity-50"
            >
              تأكيد الاعتذار
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="ma-btn ma-btn--ghost ma-btn--sm">
              تراجع
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide.mutate(true)}
            disabled={decide.isPending}
            className="ma-btn ma-btn--primary ma-btn--sm gap-2 disabled:opacity-50"
          >
            <Check aria-hidden="true" className="size-4" />
            تأكيد الموعد
          </button>
          <button type="button" onClick={() => setRejecting(true)} className="ma-btn ma-btn--soft ma-btn--sm gap-2">
            <X aria-hidden="true" className="size-4" />
            اعتذار
          </button>
        </div>
      )}
      {decide.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر إرسال القرار. حدّث الصفحة وحاول مجدداً.</p> : null}
    </article>
  );
}
