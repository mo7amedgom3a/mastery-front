"use client";

import { NotebookPen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { dealStages, probabilities, type DealCrmEntry, type DealStageId, type NextStepOption, type Probability } from "../../content/deals/types";
import { LabPanel, OptionCard } from "../bits";

/** Update the stalled deal after the recovery call: stage, revised value, probability, next step. */
export function DealUpdateForm({
  nextSteps,
  onDone,
  summary,
}: {
  nextSteps: readonly NextStepOption[];
  onDone: (entry: DealCrmEntry) => void;
  summary?: ReactNode;
}) {
  const [stage, setStage] = useState<DealStageId | null>(null);
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState<Probability | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const amount = value.trim() ? Number(value.replace(/[^\d]/g, "")) : null;
  const ready = stage && probability && nextStep && amount !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <NotebookPen className="size-5 text-sky" aria-hidden /> تحديث الصفقة في الـCRM
          </span>
        }
        subtitle="سجّل الواقع لا الأمنيات: المدير يبني توقعات الإيرادات على هذه الأرقام."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">المرحلة</span>
            <select className="ma-select" value={stage ?? ""} onChange={(e) => setStage((e.target.value || null) as DealStageId | null)}>
              <option value="">اختر المرحلة…</option>
              {dealStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">قيمة الصفقة المعدّلة (ر.س)</span>
            <input className="ma-input" inputMode="numeric" dir="ltr" placeholder="مثال: 1200000" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
        </div>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">احتمال الإغلاق</legend>
          <div role="radiogroup" className="grid grid-cols-5 gap-2">
            {probabilities.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={probability === p}
                onClick={() => setProbability(p)}
                className={
                  probability === p
                    ? "rounded-photo border border-accent bg-accent/10 py-2 text-sm font-bold tabular-nums"
                    : "rounded-photo border border-line py-2 text-sm tabular-nums hover:border-line-strong"
                }
              >
                <span dir="ltr">{p}%</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">الخطوة التالية</legend>
          <div role="radiogroup" className="flex flex-col gap-2">
            {nextSteps.map((step) => (
              <OptionCard key={step.id} selected={nextStep === step.id} onSelect={() => setNextStep(step.id)} title={step.label} />
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end">
          <Button disabled={!ready} onClick={() => ready && onDone({ stage, value: amount, probability, nextStep })}>
            احفظ الصفقة
          </Button>
        </div>
      </LabPanel>
      {summary ? <aside className="flex min-w-0 flex-col gap-4">{summary}</aside> : null}
    </div>
  );
}
