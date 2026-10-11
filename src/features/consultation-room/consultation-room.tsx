"use client";

import "@livekit/components-styles";

import { LiveKitRoom, useDataChannel, VideoConference } from "@livekit/components-react";
import { useMutation } from "@tanstack/react-query";
import { CircleDot, Clock, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { formatCountdown, useServerNow } from "@/features/consultations/model/clock";
import { ApiError } from "@/lib/api/client";
import { joinBooking, type JoinResponse } from "@/lib/api/consultations";
import { formatDateTime } from "@/lib/format";

type Ended = "left" | "time_up" | "error";

function joinErrorMessage(error: unknown): { title: string; text: string } {
  if (error instanceof ApiError) {
    const detail = error.details.detail;
    if (typeof detail === "object" && detail !== null && "code" in detail && detail.code === "join_not_open") {
      const opensAt = "opens_at" in detail && typeof detail.opens_at === "string" ? detail.opens_at : null;
      return {
        title: "لم يحن وقت الجلسة بعد",
        text: opensAt ? `يُتاح الدخول ${formatDateTime(opensAt)}.` : "يُتاح الدخول قبل الموعد بخمس دقائق.",
      };
    }
    if (error.status === 404) return { title: "لم نجد هذه الجلسة", text: "قد يكون الرابط غير صحيح، أو الجلسة مرتبطة بحساب آخر." };
    if (error.status === 409) return { title: "الجلسة غير متاحة", text: "انتهى وقت الجلسة أو لم يُؤكَّد الموعد بعد." };
  }
  return { title: "تعذّر الدخول إلى الجلسة", text: "تحقّق من اتصالك ثم حاول مجدداً." };
}

/**
 * The live consultation: asks the backend for a LiveKit token (only inside the booking's window),
 * then shows LiveKit's video conference with a countdown to the hard stop. The server closes the
 * room when the booked time is over, which disconnects both participants.
 */
export function ConsultationRoom({ bookingId }: { bookingId: string }) {
  const [ended, setEnded] = useState<Ended | null>(null);
  const join = useMutation({ mutationFn: () => joinBooking(bookingId) });
  const { mutate } = join;

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (ended) {
    return (
      <RoomMessage
        title={ended === "time_up" ? "انتهى وقت الجلسة" : ended === "error" ? "انقطع الاتصال" : "غادرت الجلسة"}
        text={
          ended === "time_up"
            ? "شكراً لك. سيكون تسجيل الجلسة متاحاً في صفحة الحجز خلال دقائق."
            : "يمكنك العودة إلى الجلسة ما دام وقتها لم ينتهِ."
        }
        bookingId={bookingId}
        onRejoin={ended === "time_up" ? undefined : () => {
          setEnded(null);
          mutate();
        }}
      />
    );
  }
  if (join.isError) {
    const { title, text } = joinErrorMessage(join.error);
    return <RoomMessage title={title} text={text} bookingId={bookingId} />;
  }
  if (!join.data) {
    return <RoomMessage title="جارٍ تجهيز الجلسة…" text="نتحقّق من موعدك ونجهّز الغرفة." bookingId={bookingId} busy />;
  }

  const grant = join.data;
  return (
    <LiveKitRoom
      serverUrl={grant.server_url}
      token={grant.token}
      connect
      video
      audio
      data-lk-theme="default"
      className="flex flex-col"
      // Inline: LiveKit's stylesheet sizes the room container relative to <body>.
      style={{ height: "100svh" }}
      onDisconnected={() => {
        const timeUp = Date.now() >= Date.parse(grant.hard_stop_at) - 60_000;
        setEnded(timeUp ? "time_up" : "left");
      }}
      onError={() => setEnded("error")}
    >
      <SessionBar grant={grant} />
      {/* LiveKit's conference sizes itself to its parent: let it fill the rest of the screen. */}
      <div className="min-h-0 flex-1 [&_.lk-video-conference]:h-full">
        <VideoConference />
      </div>
    </LiveKitRoom>
  );
}

/** Countdown to the scheduled end, a recording notice, and the server's "time is almost up" warning. */
function SessionBar({ grant }: { grant: JoinResponse }) {
  const now = useServerNow(grant.server_now);
  const [warned, setWarned] = useState(false);
  const onMessage = useCallback((message: { payload: Uint8Array }) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(message.payload)) as { type?: string };
      if (data.type === "time_warning") setWarned(true);
    } catch {
      // Not ours: ignore.
    }
  }, []);
  useDataChannel("consultation", onMessage);

  const end = Date.parse(grant.scheduled_end_at);
  const hardStop = Date.parse(grant.hard_stop_at);
  const remaining = end - now;
  const overtime = remaining <= 0;
  const nearEnd = warned || remaining <= 5 * 60_000;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-2 text-sm text-white" dir="rtl">
      <div className="flex items-center gap-2">
        <Video aria-hidden="true" className="size-4" />
        <span className="font-bold">{grant.role === "expert" ? "جلسة استشارة · الخبير" : "جلسة استشارة"}</span>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
          <CircleDot aria-hidden="true" className="size-3 text-red-400" />
          يتم تسجيل الجلسة
        </span>
      </div>
      <div
        role="timer"
        aria-live={nearEnd ? "polite" : "off"}
        className={nearEnd ? "flex items-center gap-2 font-bold text-yellow-300" : "flex items-center gap-2"}
      >
        <Clock aria-hidden="true" className="size-4" />
        {overtime ? (
          <span>
            انتهى الوقت · تُغلق الغرفة خلال <span dir="ltr" className="tabular-nums">{formatCountdown(hardStop - now)}</span>
          </span>
        ) : (
          <span>
            {nearEnd ? "اقترب انتهاء الجلسة · " : "الوقت المتبقي "}
            <span dir="ltr" className="tabular-nums">{formatCountdown(remaining)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function RoomMessage({
  title,
  text,
  bookingId,
  busy,
  onRejoin,
}: {
  title: string;
  text: string;
  bookingId: string;
  busy?: boolean;
  onRejoin?: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface p-6">
      <div role={busy ? "status" : "alert"} className="flex max-w-md flex-col items-start gap-4 rounded-panel border border-line-strong p-6">
        <h1 className="m-0 text-xl font-bold">{title}</h1>
        <p className="m-0 leading-7 text-fg-muted">{text}</p>
        {busy ? null : (
          <div className="flex flex-wrap gap-2">
            {onRejoin ? (
              <button type="button" onClick={onRejoin} className="ma-btn ma-btn--primary">
                العودة إلى الجلسة
              </button>
            ) : null}
            <ButtonLink href={routes.studentConsultation(bookingId)} variant="soft">
              صفحة الحجز
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
