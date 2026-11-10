"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86_400),
    h: Math.floor((total % 86_400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "ينتهي خلال 2ي 04:12:09". Rendered empty on the server and filled after mount (no hydration mismatch);
 * calls `onEnd` once the time is up so the bar can drop the item.
 */
export function Countdown({ to, onEnd }: { to: string; onEnd?: () => void }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(to.endsWith("Z") || /[+-]\d\d:\d\d$/.test(to) ? to : `${to}Z`).getTime();
    const tick = () => {
      const remaining = end - Date.now();
      setLeft(remaining);
      if (remaining <= 0) onEnd?.();
      return remaining;
    };
    if (tick() <= 0) return;
    const id = setInterval(() => {
      if (tick() <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [to, onEnd]);

  if (left === null || left <= 0) {
    return <span className="ma-announce__countdown" aria-hidden="true" />;
  }
  const { d, h, m, s } = parts(left);
  const label = `ينتهي خلال ${d > 0 ? `${d} يوم و` : ""}${h} ساعة و${m} دقيقة`;
  return (
    <span className="ma-announce__countdown" role="timer" aria-label={label}>
      <span aria-hidden="true" dir="ltr">
        {d > 0 ? `${d}d ` : ""}
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </span>
  );
}
