"use client";

import { clsx as cn } from "clsx";
import { CalendarDays } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/lib/auth/store";

import { pendingSlotKey } from "../model/availability";
import type { BookingVM } from "../model/types";

const loadDialog = () => import("./booking-dialog");
const BookingDialog = lazy(loadDialog);

function takePendingSlot(consultationId: number): string | null {
  try {
    const key = pendingSlotKey(consultationId);
    const value = window.sessionStorage.getItem(key);
    if (value) window.sessionStorage.removeItem(key);
    return value;
  } catch {
    // Storage blocked (private mode, embedded view): the visitor simply picks the slot again.
    return null;
  }
}

/**
 * "احجز موعدك": opens the booking dialog. The dialog (and the calendar library with it) is only
 * downloaded once the visitor shows interest in the button, and only mounted while open, so each
 * opening starts from the current time.
 */
export function BookingButton({ booking, className }: { booking: BookingVM; className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [session, setSession] = useState<{ initialStart: string | null } | null>(null);

  // Signed in after choosing a slot as a guest: reopen on that slot. The page renders this button
  // twice (beside the content, and above it on phones); only the visible one restores.
  useEffect(() => {
    const restore = () => {
      if (useAuthStore.getState().status !== "authenticated") return;
      if (buttonRef.current?.offsetParent == null) return;
      const initialStart = takePendingSlot(booking.id);
      if (initialStart) setSession({ initialStart });
    };
    // Already signed in when arriving through in-app navigation; otherwise wait for the session check.
    const timer = setTimeout(restore, 0);
    const unsubscribe = useAuthStore.subscribe(restore);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [booking.id]);

  const preload = () => void loadDialog();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        onPointerEnter={preload}
        onFocus={preload}
        onClick={() => setSession({ initialStart: null })}
        className={cn("ma-btn ma-btn--primary ma-btn--block gap-2", className)}
      >
        <CalendarDays aria-hidden="true" className="size-5" />
        احجز موعدك
      </button>
      {session ? (
        <Suspense fallback={null}>
          <BookingDialog booking={booking} initialStart={session.initialStart} onClose={() => setSession(null)} />
        </Suspense>
      ) : null}
    </>
  );
}
