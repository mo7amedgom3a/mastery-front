"use client";

import { FileText, Scale } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { hrFacts, policy, resolutionActions, type HrFact } from "../../content/hr";
import { LabPanel, OptionCard } from "../bits";

/** The company policy excerpt, the neutral reference for every decision. */
export function PolicyCard({ compact = false }: { compact?: boolean }) {
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Scale className="size-5 text-green" aria-hidden /> سياسة «نما» للعلاقات المهنية
        </span>
      }
      subtitle={compact ? undefined : "مقتطف من دليل الموظف"}
    >
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {policy.map((clause, index) => (
          <li key={clause.id} className="flex gap-2 text-[13px] leading-6">
            <span className="font-bold tabular-nums">{index + 1}.</span>
            <span>
              <strong>{clause.title}:</strong> <span className="text-fg-muted">{clause.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </LabPanel>
  );
}

/** Case file shown during the briefing. */
export function CaseFile() {
  return (
    <div className="flex flex-col gap-2 rounded-photo border border-line p-4">
      <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
        <FileText className="size-4 text-green" aria-hidden /> ملف الحالة
      </h3>
      <ul className="m-0 flex list-disc flex-col gap-1 ps-5 text-[13px] leading-6 text-fg-muted">
        <li>الأحد: خالد كتب في قناة #فريق-المنتج: «كالعادة الشغل علينا والكلام لغيرنا».</li>
        <li>الإثنين: سارة رفعت شكوى للمدير بسبب «أسلوب غير مهني».</li>
        <li>الفريق متوتر، ونسبة إنجاز المهام انخفضت 20٪ هذا الأسبوع.</li>
        <li>إطلاق المنتج بعد 4 أسابيع.</li>
      </ul>
    </div>
  );
}

/** Phase 4: build the written resolution plan. */
export function ResolutionBuilder({ facts, onDone }: { facts: string[]; onDone: (actions: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  const known = facts.filter((f): f is HrFact => f in hrFacts);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <LabPanel title="خطة الحل المكتوبة" subtitle="اختر الإجراءات التي ستدخل في الاتفاق (3 إلى 5). كل إجراء يجب أن يعالج سببًا حقيقيًا ويلتزم بالسياسة.">
        <div className="flex flex-col gap-2">
          {resolutionActions.map((action) => (
            <OptionCard
              key={action.id}
              multi
              selected={picked.includes(action.id)}
              disabled={!picked.includes(action.id) && picked.length >= 5}
              onSelect={() => toggle(action.id)}
              title={action.label}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-fg-muted tabular-nums">{picked.length} إجراءات</span>
          <Button disabled={picked.length < 3} onClick={() => onDone(picked)}>
            اعتمد الخطة
          </Button>
        </div>
      </LabPanel>
      <div className="flex flex-col gap-6">
        <LabPanel title="ما اكتشفته في الجلسات">
          {known.length ? (
            <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6">
              {known.map((fact) => (
                <li key={fact}>{hrFacts[fact]}</li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-fg-muted">لم تكتشف أسباب الخلاف في الجلسات.</p>
          )}
        </LabPanel>
        <PolicyCard compact />
      </div>
    </div>
  );
}
