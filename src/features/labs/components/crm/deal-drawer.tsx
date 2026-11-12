"use client";

import { Bell, CalendarDays, ChevronDown, Mail, NotebookPen, Phone, TriangleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import { sar } from "../documents/doc-types";
import type { Activity, ActivityType, PipelineDeal } from "./crm-types";

const typeIcon: Record<ActivityType, LucideIcon> = {
  email: Mail,
  call: Phone,
  meeting: CalendarDays,
  note: NotebookPen,
  ticket: TriangleAlert,
  system: Bell,
};
const typeLabel: Record<ActivityType, string> = {
  email: "بريد",
  call: "مكالمة",
  meeting: "اجتماع",
  note: "ملاحظة",
  ticket: "بلاغ",
  system: "النظام",
};

/** The deal file: header numbers and an expandable activity timeline (the evidence for diagnosis). */
export function DealDrawer({
  deal,
  probability,
  contact,
  timeline,
}: {
  deal: PipelineDeal;
  probability: number;
  contact: string;
  timeline: readonly Activity[];
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface p-5 md:p-6" aria-label="ملف الصفقة">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-fg-muted">ملف الصفقة</span>
            <h2 className="m-0 text-[17px] leading-7 font-bold">{deal.title}</h2>
            <span className="text-[13px] text-fg-muted">
              {deal.company} · {contact}
            </span>
          </div>
          <span className="rounded-chip bg-pink px-2.5 py-0.5 text-[12px] font-bold text-ink">متعثرة منذ {deal.ageDays} يوم</span>
        </div>
        <dl className="m-0 grid grid-cols-3 gap-2">
          {[
            ["قيمة الصفقة", sar(deal.value)],
            ["احتمال الإغلاق", `${probability}%`],
            ["المسؤول", deal.owner],
          ].map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-0.5 rounded-photo border border-line bg-surface-alt/40 p-2.5">
              <dt className="text-[11px] text-fg-muted">{label}</dt>
              <dd dir={/[؀-ۿ]/.test(value.replace("ر.س", "")) ? undefined : "ltr"} className="m-0 truncate text-end text-sm font-bold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </header>
      <ol className="m-0 flex list-none flex-col gap-0 p-0" aria-label="سجل النشاط">
        {timeline.map((item, index) => {
          const Icon = typeIcon[item.type];
          return (
            <li key={item.id} className="relative flex gap-3 pb-3">
              {index < timeline.length - 1 ? <span aria-hidden className="absolute start-[15px] top-8 bottom-0 w-px bg-line" /> : null}
              <span
                className={cn(
                  "relative flex size-8 shrink-0 items-center justify-center rounded-full border",
                  item.flag ? "border-pink bg-pink/15 text-pink" : "border-line bg-surface-alt text-fg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <details className="group min-w-0 flex-1 rounded-photo border border-line bg-surface open:bg-surface-alt/30">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-2 p-2.5 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] leading-5 font-semibold">{item.title}</span>
                    <span className="text-[11px] text-fg-muted">
                      {typeLabel[item.type]} · {item.by} · {item.at}
                    </span>
                  </span>
                  <ChevronDown className="mt-0.5 size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="m-0 border-t border-line px-2.5 py-2 text-[13px] leading-6 whitespace-pre-line text-fg-muted">{item.body}</p>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
