"use client";

import { Lock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A mock government e-service window: browser chrome with an address bar, a green national
 * header strip and the service body. Purely visual; the portal names are generic on purpose.
 */
export function PortalWindow({
  url,
  agency,
  service,
  children,
  className,
}: {
  url: string;
  agency: string;
  service: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col overflow-hidden rounded-panel border border-line-strong bg-surface shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-line bg-surface-alt px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="size-2.5 rounded-full bg-pink" />
          <span className="size-2.5 rounded-full bg-yellow" />
          <span className="size-2.5 rounded-full bg-green" />
        </span>
        <span dir="ltr" className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-chip bg-surface px-3 py-1 text-[12px] text-fg-muted">
          <Lock className="size-3 shrink-0" aria-hidden />
          {url}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 bg-[#0b6b3a] px-4 py-2.5 text-white">
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="size-4" aria-hidden /> {agency}
        </span>
        <span className="text-[12px] opacity-90">{service}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-4 p-4 md:p-5">{children}</div>
    </div>
  );
}

export type TimelineStatus = "done" | "rejected" | "pending" | "locked";

/** Vertical status timeline used by the portal run (applications and their outcomes). */
export function StatusTimeline({
  items,
}: {
  items: readonly { id: string; label: string; status: TimelineStatus; detail?: string; meta?: string }[];
}) {
  return (
    <ol className="m-0 flex list-none flex-col gap-0 p-0">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {index < items.length - 1 ? <span aria-hidden className="absolute top-6 bottom-0 start-[9px] w-px bg-line" /> : null}
          <span
            aria-hidden
            className={cn(
              "mt-1 size-[19px] shrink-0 rounded-full border-2",
              item.status === "done" && "border-green bg-green",
              item.status === "rejected" && "border-pink bg-pink",
              item.status === "pending" && "border-yellow bg-surface",
              item.status === "locked" && "border-line bg-surface-alt",
            )}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-6 font-semibold">
              {item.label}
              <span className="sr-only">
                {" "}
                · {item.status === "done" ? "مكتمل" : item.status === "rejected" ? "مرفوض" : item.status === "pending" ? "متاح" : "مقفل"}
              </span>
            </span>
            {item.detail ? <span className="text-[12px] leading-5 text-fg-muted">{item.detail}</span> : null}
            {item.meta ? <span className="text-[12px] leading-5 text-fg-muted tabular-nums">{item.meta}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
