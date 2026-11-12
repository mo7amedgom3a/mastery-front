"use client";

import { Calculator, TrendingDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { FunnelAnswer, SalesFailureScenario } from "../../content/sales-failure/types";
import { LabPanel, Pill } from "../bits";

const rows = [
  { key: "prospects", label: "عملاء محتملون", width: "100%" },
  { key: "calls", label: "مكالمات", width: "82%" },
  { key: "meetings", label: "اجتماعات", width: "62%" },
  { key: "proposals", label: "عروض سعر", width: "42%" },
] as const;

/** The funnel maths: start from the deal target and work backwards through the conversion rates. */
export function FunnelCalculator({
  scenario,
  onDone,
}: {
  scenario: SalesFailureScenario;
  onDone: (answer: FunnelAnswer) => void;
}) {
  const [values, setValues] = useState<Record<(typeof rows)[number]["key"], string>>({
    prospects: "",
    calls: "",
    meetings: "",
    proposals: "",
  });
  const answer: FunnelAnswer = {
    prospects: Number(values.prospects) || 0,
    calls: Number(values.calls) || 0,
    meetings: Number(values.meetings) || 0,
    proposals: Number(values.proposals) || 0,
  };
  const ready = rows.every((row) => answer[row.key] > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Calculator className="size-5 text-accent" aria-hidden /> معادلة القمع
          </span>
        }
        subtitle={`الهدف ${scenario.funnel.deals} صفقات هذا الشهر. ابدأ من الهدف وارجع للخلف حتى تعرف كم عميلًا تحتاج.`}
        action={<Pill>تجنّب المعادلات الكمية = سبب فشل</Pill>}
      >
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={`funnel-${row.key}`} className="text-sm font-semibold">
                  {row.label}
                </label>
                <input
                  id={`funnel-${row.key}`}
                  className="ma-input w-32 text-end"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="0"
                  value={values[row.key]}
                  onChange={(event) => setValues((current) => ({ ...current, [row.key]: event.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className={cn("h-full rounded-full bg-accent/60")} style={{ width: row.width }} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-photo bg-surface-alt px-3 py-2 text-sm">
            <span className="font-semibold">الصفقات المغلقة</span>
            <span className="text-lg font-bold tabular-nums">{scenario.funnel.deals}</span>
          </div>
        </div>
        <details className="rounded-photo border border-line p-3 text-sm leading-6">
          <summary className="cursor-pointer font-semibold">تلميح: كيف ترجع للخلف؟</summary>
          <p className="m-0 mt-2 text-fg-muted">
            الصفقات ÷ نسبة الإغلاق = العروض. العروض ÷ نسبة تحويل العرض = الاجتماعات. الاجتماعات ÷ نسبة تحويل
            الاجتماع = المكالمات. المكالمات ÷ نسبة تحويل المكالمة = العملاء المحتملون.
          </p>
        </details>
        <div className="flex justify-end">
          <Button disabled={!ready} onClick={() => ready && onDone(answer)}>
            التالي: بنك الأسئلة
          </Button>
        </div>
      </LabPanel>

      <aside className="flex flex-col gap-4">
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <TrendingDown className="size-5 text-pink" aria-hidden /> معدلات التحويل
            </span>
          }
        >
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
            <li className="flex justify-between rounded-photo border border-line px-3 py-2">
              <span>عميل محتمل ← مكالمة</span>
              <span className="font-bold tabular-nums">{Math.round(scenario.funnel.prospectToCall * 100)}٪</span>
            </li>
            <li className="flex justify-between rounded-photo border border-line px-3 py-2">
              <span>مكالمة ← اجتماع</span>
              <span className="font-bold tabular-nums">{Math.round(scenario.funnel.callToMeeting * 100)}٪</span>
            </li>
            <li className="flex justify-between rounded-photo border border-line px-3 py-2">
              <span>اجتماع ← عرض</span>
              <span className="font-bold tabular-nums">{Math.round(scenario.funnel.meetingToProposal * 100)}٪</span>
            </li>
            <li className="flex justify-between rounded-photo border border-line px-3 py-2">
              <span>عرض ← صفقة</span>
              <span className="font-bold tabular-nums">{Math.round(scenario.funnel.proposalToClose * 100)}٪</span>
            </li>
          </ul>
        </LabPanel>
        <LabPanel title="لماذا هذا مهم؟">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            بلا أرقام، ستعمل شهرًا كاملًا ثم تكتشف أنك قابلت 20 عميلًا فقط. الأرقام تجبرك على التنقيب
            والمكالمات الباردة قبل أن تحتاجها.
          </p>
        </LabPanel>
      </aside>
    </div>
  );
}
