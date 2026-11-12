"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { SalesFailureScenario } from "../../content/sales-failure/types";
import { LabPanel, OptionCard, Pill } from "../bits";

const PICK = 3;

/** Pick the three questions that open the situation, the problem and the impact. */
export function QuestionBank({ scenario, onDone }: { scenario: SalesFailureScenario; onDone: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) => {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      if (current.length >= PICK) return current;
      return [...current, id];
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <MessageCircleQuestion className="size-5 text-accent" aria-hidden /> بنك الأسئلة
          </span>
        }
        subtitle="من يطرح الأسئلة يقود الحوار. اختر ثلاثة أسئلة تفتح الوضع والمشكلة والأثر قبل أي عرض."
        action={<Pill>{picked.length} / {PICK}</Pill>}
      >
        <div className="flex flex-col gap-2">
          {scenario.questionBank.map((question) => (
            <OptionCard
              key={question.id}
              multi
              selected={picked.includes(question.id)}
              onSelect={() => toggle(question.id)}
              title={question.label}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={picked.length !== PICK} onClick={() => picked.length === PICK && onDone(picked)}>
            التالي: المكالمة الباردة
          </Button>
        </div>
      </LabPanel>

      <aside className="flex flex-col gap-4">
        <LabPanel title="تسلسل الاكتشاف" subtitle="الوضع ← المشكلة ← الأثر ← عائد الحل">
          <ol className="m-0 flex list-none flex-col gap-2 p-0 text-sm leading-6">
            {[
              ["الوضع", "كيف تعملون اليوم؟"],
              ["المشكلة", "ما أكبر ما يزعجكم أو يكلفكم؟"],
              ["الأثر", "كيف ينعكس ذلك على المال والوقت والفريق؟"],
              ["عائد الحل", "لو حلّيناها، ماذا يتغير؟"],
            ].map(([label, hint], index) => (
              <li key={label} className="flex items-start gap-2 rounded-photo border border-line px-3 py-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                  {index + 1}
                </span>
                <span>
                  <strong>{label}:</strong> <span className="text-fg-muted">{hint}</span>
                </span>
              </li>
            ))}
          </ol>
        </LabPanel>
        <LabPanel title="تحذير">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            الأسئلة المغلقة والسعرية المبكرة تستهلك صبر العميل. لا تسأل «تحبون تشترون؟» قبل أن تعرف
            لماذا يحتاجون.
          </p>
        </LabPanel>
      </aside>
    </div>
  );
}
