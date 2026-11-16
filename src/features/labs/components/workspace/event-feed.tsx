"use client";

import { AtSign, Building2, Mail, MessageCircle, Phone, Radio, Server } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type FeedChannel = "email" | "social" | "call" | "regulator" | "chat" | "system" | "media";

export type FeedItem = {
  id: string;
  /** Simulated time label, e.g. "ساعة 6". */
  at: string;
  channel: FeedChannel;
  from: string;
  title: string;
  body: string;
  severity?: "info" | "warn" | "critical";
};

const icons: Record<FeedChannel, ReactNode> = {
  email: <Mail className="size-4" aria-hidden />,
  social: <AtSign className="size-4" aria-hidden />,
  call: <Phone className="size-4" aria-hidden />,
  regulator: <Building2 className="size-4" aria-hidden />,
  chat: <MessageCircle className="size-4" aria-hidden />,
  system: <Server className="size-4" aria-hidden />,
  media: <Radio className="size-4" aria-hidden />,
};

const channelLabel: Record<FeedChannel, string> = {
  email: "بريد",
  social: "منصة X",
  call: "مكالمة",
  regulator: "جهة رسمية",
  chat: "Slack",
  system: "تنبيه نظام",
  media: "إعلام",
};

/** The war-room inbox: newest first, severity on the edge. */
export function EventFeed({ items, title = "غرفة العمليات" }: { items: readonly FeedItem[]; title?: string }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-2">
      <ol className="m-0 flex max-h-[min(60vh,560px)] list-none flex-col gap-2 overflow-y-auto p-0" aria-live="polite">
        {[...items].reverse().map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "flex flex-col gap-1 rounded-photo border border-line bg-surface p-3 [border-inline-start-width:4px]",
              item.severity === "critical" ? "border-s-pink" : item.severity === "warn" ? "border-s-yellow" : "border-s-sky",
              index === 0 && "shadow-[0_0_0_2px_var(--accent)]",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-fg-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
                {icons[item.channel]} {channelLabel[item.channel]} · {item.from}
              </span>
              <span className="tabular-nums">{item.at}</span>
            </div>
            <p className="m-0 text-sm leading-6 font-bold">{item.title}</p>
            <p className="m-0 text-[13px] leading-6 text-fg-muted">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
