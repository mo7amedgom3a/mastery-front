"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { sendActivityHeartbeat, type ActivitySurface } from "@/lib/api/insights";
import { useAuthStore } from "@/lib/auth/store";

const BEAT_MS = 60_000;
/** No input for this long and the student is treated as away (tab left open, coffee break). */
const IDLE_MS = 2 * 60_000;

/** Which part of the student area a path belongs to, for the "where you spend time" chart. */
export function surfaceForPath(pathname: string): ActivitySurface {
  const path = pathname.replace(/\/+$/, "");
  if (/^\/students\/(learning|access|progress|exams|certificates|session)(\/|$)/.test(path)) return "learning";
  if (/^\/students\/planner(\/|$)/.test(path)) return "planner";
  if (path === "/students" || /^\/students\/insights(\/|$)/.test(path)) return "dashboard";
  return "other";
}

/**
 * Counts real active time: one heartbeat a minute while the tab is visible *and* the student
 * touched the page in the last two minutes. The server also ignores beats closer than 50 s
 * (across tabs), so several open tabs never count double. Failures are silent.
 */
export function useActivityHeartbeat() {
  const pathname = usePathname();
  const signedIn = useAuthStore((state) => Boolean(state.user));
  const lastInput = useRef(0);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!signedIn) return;
    lastInput.current = Date.now();
    const markActive = () => {
      lastInput.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, markActive, { passive: true, capture: true });

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInput.current > IDLE_MS) return;
      sendActivityHeartbeat({ surface: surfaceForPath(pathRef.current ?? "") }).catch(() => undefined);
    };
    const timer = window.setInterval(beat, BEAT_MS);

    return () => {
      window.clearInterval(timer);
      for (const name of events) window.removeEventListener(name, markActive, { capture: true });
    };
  }, [signedIn]);
}
