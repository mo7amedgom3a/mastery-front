"use client";

import { useMutation } from "@tanstack/react-query";
import { PlayCircle, Video } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getRecording, type ConsultationBooking } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

import { formatCountdown, useServerNow } from "../model/clock";

/**
 * Entry to the live session: a countdown until the room opens (five minutes before the start),
 * then the join button until the session's hard stop.
 */
export function JoinPanel({ booking }: { booking: ConsultationBooking }) {
  const now = useServerNow(booking.server_now);
  if (booking.status !== "confirmed" && booking.status !== "in_progress") return null;
  if (!booking.join_opens_at || !booking.hard_stop_at) return null;

  const opensAt = Date.parse(booking.join_opens_at);
  const closesAt = Date.parse(booking.hard_stop_at);
  if (now >= closesAt) {
    return <p className="m-0 text-sm text-fg-muted">انتهى وقت الجلسة.</p>;
  }
  if (now < opensAt) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" disabled className="ma-btn ma-btn--primary gap-2 opacity-50">
          <Video aria-hidden="true" className="size-5" />
          دخول الجلسة
        </button>
        <p className="m-0 text-sm text-fg-muted" aria-live="off">
          يُتاح الدخول بعد <span dir="ltr" className="font-bold tabular-nums">{formatCountdown(opensAt - now)}</span>
          {" "}({formatDateTime(booking.join_opens_at)})
        </p>
      </div>
    );
  }
  return (
    <ButtonLink href={routes.consultationSession(booking.booking_id)} variant="primary" className="gap-2 self-start">
      <Video aria-hidden="true" className="size-5" />
      دخول الجلسة الآن
    </ButtonLink>
  );
}

/** Plays the session recording through a short-lived link fetched on demand. */
export function RecordingPlayer({ booking }: { booking: ConsultationBooking }) {
  const [url, setUrl] = useState<string | null>(null);
  const load = useMutation({
    mutationFn: () => getRecording(booking.booking_id),
    onSuccess: (recording) => setUrl(recording.url),
  });

  if (!booking.recording_available) {
    if (booking.recording_status === "recording") {
      return <p className="m-0 text-sm text-fg-muted">يجري تجهيز تسجيل الجلسة، وسيظهر هنا خلال دقائق.</p>;
    }
    if (booking.recording_status === "failed") {
      return <p className="m-0 text-sm text-fg-muted">تعذّر حفظ تسجيل هذه الجلسة.</p>;
    }
    return null;
  }
  if (url) {
    return (
      // The link expires; reopening the page fetches a fresh one.
      <video controls preload="metadata" src={url} className="aspect-video w-full rounded-panel bg-ink">
        <track kind="captions" />
      </video>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => load.mutate()}
        disabled={load.isPending}
        className="ma-btn ma-btn--soft gap-2 self-start disabled:opacity-50"
      >
        <PlayCircle aria-hidden="true" className="size-5" />
        {load.isPending ? "جارٍ التحميل…" : "مشاهدة تسجيل الجلسة"}
      </button>
      {load.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر تحميل التسجيل. حاول مجدداً.</p> : null}
    </div>
  );
}
