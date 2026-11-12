"use client";

import { CalendarCheck, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { FollowUpSlot, SalesFailureScenario } from "../../content/sales-failure/types";
import { LabPanel, OptionCard, Pill } from "../bits";

type Touches = Record<FollowUpSlot, string | null>;

/** Three follow-up touches: when, through which channel, and with what value. */
export function FollowUpPlanner({
  scenario,
  onDone,
}: {
  scenario: SalesFailureScenario;
  onDone: (touches: Touches) => void;
}) {
  const [touches, setTouches] = useState<Touches>({ 1: null, 2: null, 3: null });
  const ready = Boolean(touches[1] && touches[2] && touches[3]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Send className="size-5 text-accent" aria-hidden /> خطة المتابعة
          </span>
        }
        subtitle="ثلاث لمسات فقط. لكل لمسة وقت وسبب ومحتوى — لا «أرسل لي وأتابع لاحقًا»."
        action={<Pill>{ready ? "جاهزة" : "اختر لمسة لكل مرحلة"}</Pill>}
      >
        <div className="flex flex-col gap-5">
          {([1, 2, 3] as const).map((slot) => (
            <div key={slot} className="flex flex-col gap-2">
              <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
                <CalendarCheck className="size-4 text-sky" aria-hidden /> اللمسة {slot}
              </h3>
              <div className="flex flex-col gap-2">
                {scenario.followUp
                  .filter((option) => option.slot === slot)
                  .map((option) => (
                    <OptionCard
                      key={option.id}
                      selected={touches[slot] === option.id}
                      onSelect={() => setTouches((current) => ({ ...current, [slot]: option.id }))}
                      title={option.label}
                      detail={`${option.timing} · ${option.channel}`}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={!ready} onClick={() => ready && onDone(touches)}>
            التالي: تحقق سريع
          </Button>
        </div>
      </LabPanel>

      <aside className="flex flex-col gap-4">
        <LabPanel title="سحر المتابعة" subtitle="من دورة فشل المبيعات">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            «العميل ما يشتري أحيانًا في شهر أو شهرين. لو ما كنت حاضرًا خلال المدة، تغيّرت الظروف وراحت
            الصفقة. المتابعة ليست إزعاجًا؛ هي إبقاء الحل حاضرًا حين يتغير وضع العميل.»
          </p>
        </LabPanel>
        <LabPanel title="قاعدة اللمسات الثلاث">
          <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6 text-fg-muted">
            <li>اللمسة 1: نفس اليوم، ملخص + موعد + وعد.</li>
            <li>اللمسة 2: قيمة جديدة (دراسة حالة أو رقم).</li>
            <li>اللمسة 3: مراجعة نتيجة أو خطوة قرار.</li>
          </ul>
        </LabPanel>
      </aside>
    </div>
  );
}
