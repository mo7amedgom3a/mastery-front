"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";

import {
  cancelMyBooking,
  consultationKeys,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

/**
 * The customer withdraws a paid booking. The server decides whether the cutoff
 * has passed (`can_cancel`); inside the window the booking moves to the refund
 * review queue and the slot returns to the expert's calendar.
 */
export function CancelBooking({ booking }: { booking: ConsultationBooking }) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useMutation({
    mutationFn: () => cancelMyBooking(booking.booking_id, { reason: reason.trim() || null }),
    onSuccess: () => setOpen(false),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    cancel.mutate();
  };

  if (!booking.can_cancel) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="ma-btn ma-btn--soft ma-btn--sm self-start">
        إلغاء الموعد
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-panel border border-line p-4 text-sm">
      <p className="m-0 leading-6">
        يُفتح طلب استرداد المبلغ المدفوع، ويعود الموعد إلى تقويم الخبير.
        {booking.cancellation_deadline_at ? (
          <> آخر موعد للإلغاء: {formatDateTime(booking.cancellation_deadline_at)}.</>
        ) : null}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={reasonId} className="font-bold">
          سبب الإلغاء (اختياري)
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
          لم يعد ممكناً إلغاء هذا الموعد: بدأت الجلسة أو انتهت مهلة الإلغاء.
        </p>
      ) : null}
    </form>
  );
}
