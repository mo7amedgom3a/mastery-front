"use client";

import { AlarmClock, CircleAlert, Package, ShieldCheck, Tag, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { customerProfile, orderTimeline, supportPolicy, triagePriorities, triageTags, type Triage, type TriagePriority } from "../../content/support";
import { clock } from "../../model/scoring";
import { LabPanel, OptionCard } from "../bits";
import { sar } from "../documents/doc-types";

const SLA_SECONDS = 10 * 60;

/** Help-desk ticket view: customer, order timeline, policy, SLA countdown and the triage form. */
export function TicketConsole({ onDone }: { onDone: (triage: Triage, seconds: number) => void }) {
  const [priority, setPriority] = useState<TriagePriority | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    started.current = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - started.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = Math.max(0, SLA_SECONDS - elapsed);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5 md:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-fg-muted">
                <span dir="ltr">TCK-90871</span> · محادثة مباشرة · مُصعّدة من المستوى الأول
              </span>
              <h2 className="m-0 text-[17px] leading-7 font-bold">ثلاجة تالفة + خصم مكرر · طلب 48213</h2>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-[13px] font-bold text-ink",
                left > 300 ? "bg-yellow" : "bg-pink",
              )}
              aria-label="الوقت المتبقي لاتفاقية الرد الأول"
            >
              <AlarmClock className="size-4" aria-hidden /> SLA <span className="tabular-nums" dir="ltr">{clock(left)}</span>
            </span>
          </header>
          <div className="rounded-photo border border-pink/50 bg-pink/10 p-3 text-sm leading-7">
            <span className="mb-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-pink">
              <CircleAlert className="size-4" aria-hidden /> آخر رسالة من العميلة · 08:40
            </span>
            <p className="m-0">«للمرة الثالثة أكلم خدمتكم! الثلاجة وصلت مكسورة، وسحبتوا فلوسي مرتين! والحين بكتب في تويتر عن تعاملكم.»</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
              <Package className="size-4 text-sky" aria-hidden /> سجل الطلب
            </h3>
            <ol className="m-0 flex list-none flex-col gap-0 p-0">
              {orderTimeline.map((item, index) => (
                <li key={index} className="flex gap-3 border-s-2 border-line ps-3 pb-2.5">
                  <span className="w-28 shrink-0 text-[12px] text-fg-muted">{item.at}</span>
                  <span className={cn("text-[13px] leading-6", item.flag && "font-semibold text-pink")}>{item.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <Tag className="size-5 text-sky" aria-hidden /> فرز التذكرة
            </span>
          }
          subtitle="حدد الأولوية والتصنيفات قبل أن ترد. التصنيف الصحيح يوجه التذكرة للفرق المعنية."
        >
          <div role="radiogroup" aria-label="الأولوية" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {triagePriorities.map((p) => (
              <OptionCard key={p.id} selected={priority === p.id} onSelect={() => setPriority(p.id)} title={p.label} />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {triageTags.map((t) => (
              <OptionCard
                key={t.id}
                multi
                selected={tags.includes(t.id)}
                onSelect={() => setTags((c) => (c.includes(t.id) ? c.filter((x) => x !== t.id) : [...c, t.id]))}
                title={t.label}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!priority || !tags.length} onClick={() => onDone({ priority, tags }, elapsed)}>
              افتح المحادثة
            </Button>
          </div>
        </LabPanel>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <CustomerCard />
        <PolicyPanel />
      </aside>
    </div>
  );
}

export function CustomerCard() {
  const rows: [string, string][] = [
    ["العميلة", customerProfile.name],
    ["عميلة منذ", customerProfile.since],
    ["الطلبات", String(customerProfile.orders)],
    ["قيمة العميلة", sar(customerProfile.ltv)],
    ["المدينة", customerProfile.city],
    ["تذاكر سابقة", customerProfile.pastTickets],
  ];
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <UserRound className="size-5 text-sky" aria-hidden /> ملف العميلة
        </span>
      }
    >
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="m-0 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </LabPanel>
  );
}

export function PolicyPanel() {
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="size-5 text-green" aria-hidden /> سياسة التعويض
        </span>
      }
    >
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {supportPolicy.map((item) => (
          <li key={item.title} className="rounded-photo border border-line px-3 py-2 text-[13px] leading-6">
            <span className="font-bold">{item.title}: </span>
            <span className="text-fg-muted">{item.text}</span>
          </li>
        ))}
      </ul>
    </LabPanel>
  );
}
