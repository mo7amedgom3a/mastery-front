"use client";

import { useEffect, useState } from "react";

/**
 * "Now" on the server's clock, ticking every second. The backend decides when the room opens and
 * closes, so countdowns follow its clock (`server_now`) instead of a possibly wrong device clock.
 */
export function useServerNow(serverNow: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Offset of the server clock, measured when its reading arrived.
    const offset = serverNow ? Date.parse(serverNow) - Date.now() : 0;
    const tick = () => setNow(Date.now() + offset);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [serverNow]);

  return now;
}

/** "05:09" or "1:02:09" for a remaining duration in milliseconds. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
