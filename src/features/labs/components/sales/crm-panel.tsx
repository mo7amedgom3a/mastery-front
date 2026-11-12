"use client";

import { Building2, Mail, NotebookPen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import {
  accountRecord,
  crmNextSteps,
  crmNoteOptions,
  crmStages,
  emailBlocks,
  hypotheses,
  type CrmEntry,
  type CrmNextStep,
  type CrmStage,
} from "../../content/sales";
import { LabPanel, OptionCard } from "../bits";

const HYPOTHESES = 3;

/** The mock CRM account record. */
export function AccountCard() {
  const rows: [string, string][] = [
    ["الشركة", accountRecord.company],
    ["القطاع", accountRecord.industry],
    ["الحجم", accountRecord.size],
    ["المنطقة", accountRecord.region],
    ["جهة الاتصال", accountRecord.contact],
    ["النظام الحالي", accountRecord.current],
  ];
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Building2 className="size-5 text-sky" aria-hidden /> سجل الحساب في الـCRM
        </span>
      }
      subtitle="الصفقة: «أبكس · تحسين المسارات» · المرحلة الحالية: تأهيل أولي"
    >
      <dl className="m-0 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="m-0 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold">ملاحظات سابقة</h3>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {accountRecord.notes.map((note) => (
            <li key={note} className="rounded-photo border border-line px-3 py-2 text-[13px] leading-6 text-fg-muted">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </LabPanel>
  );
}

/** Phase 1: read the account and pick three discovery hypotheses. */
export function PrepPanel({ onDone }: { onDone: (hypotheses: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : current.length < HYPOTHESES ? [...current, id] : current));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AccountCard />
      <LabPanel title="فرضيات الاكتشاف" subtitle={`بناءً على السجل: ما أهم ${HYPOTHESES} آلام تتوقعها لدى العميل؟ ستبني عليها أسئلتك.`}>
        <div className="flex flex-col gap-2">
          {hypotheses.map((h) => (
            <OptionCard
              key={h.id}
              multi
              selected={picked.includes(h.id)}
              disabled={!picked.includes(h.id) && picked.length >= HYPOTHESES}
              onSelect={() => toggle(h.id)}
              title={h.label}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span dir="ltr" className="text-[13px] text-fg-muted tabular-nums">
            {picked.length} / {HYPOTHESES}
          </span>
          <Button disabled={picked.length !== HYPOTHESES} onClick={() => onDone(picked)}>
            ابدأ المكالمة
          </Button>
        </div>
      </LabPanel>
    </div>
  );
}

/** Phase 3: log the call in the CRM. */
export function CrmLogForm({ onDone }: { onDone: (entry: CrmEntry) => void }) {
  const [stage, setStage] = useState<CrmStage | null>(null);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState<CrmNextStep | null>(null);
  const dealValue = value.trim() ? Number(value.replace(/[^\d]/g, "")) : null;
  const ready = stage && nextStep && dealValue !== null;

  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <NotebookPen className="size-5 text-sky" aria-hidden /> تحديث الصفقة في الـCRM
        </span>
      }
      subtitle="سجّل ما حدث فعلًا في المكالمة. المراقب يقارن سجلك بالحوار."
      className="mx-auto w-full max-w-4xl"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">مرحلة الصفقة</span>
          <select className="ma-select" value={stage ?? ""} onChange={(e) => setStage((e.target.value || null) as CrmStage | null)}>
            <option value="">اختر المرحلة…</option>
            {crmStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">قيمة الصفقة السنوية ($)</span>
          <input
            className="ma-input"
            inputMode="numeric"
            dir="ltr"
            placeholder="مثال: 38000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold">ملاحظات المكالمة (اختر ما قاله العميل فعلًا)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {crmNoteOptions.map((option) => (
            <OptionCard
              key={option.id}
              multi
              selected={notes.includes(option.id)}
              onSelect={() => setNotes((current) => (current.includes(option.id) ? current.filter((x) => x !== option.id) : [...current, option.id]))}
              title={option.label}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold">الخطوة التالية</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
          {crmNextSteps.map((step) => (
            <OptionCard key={step.id} selected={nextStep === step.id} onSelect={() => setNextStep(step.id)} title={step.label} />
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button
          disabled={!ready}
          onClick={() => ready && onDone({ stage, dealValue, notes, nextStep })}
        >
          احفظ وانتقل للإيميل
        </Button>
      </div>
    </LabPanel>
  );
}

/** Phase 4: assemble the follow-up email from paragraph blocks. */
export function EmailComposer({ onDone }: { onDone: (blocks: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(["e-thanks"]);
  const ordered = emailBlocks.filter((b) => picked.includes(b.id));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LabPanel title="فقرات متاحة" subtitle="اختر الفقرات التي تبني إيميل متابعة دقيقًا. انتبه للوعود التي لا تملكها.">
        <div className="flex flex-col gap-2">
          {emailBlocks.map((block) => (
            <OptionCard
              key={block.id}
              multi
              selected={picked.includes(block.id)}
              onSelect={() =>
                setPicked((current) => (current.includes(block.id) ? current.filter((x) => x !== block.id) : [...current, block.id]))
              }
              title={block.text}
            />
          ))}
        </div>
      </LabPanel>
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Mail className="size-5 text-sky" aria-hidden /> معاينة الإيميل
          </span>
        }
      >
        <div className="flex flex-col gap-3 rounded-photo border border-line bg-surface-alt/30 p-4 text-sm leading-7">
          <div className="flex flex-col gap-0.5 border-b border-line pb-3 text-[13px] text-fg-muted">
            <span>إلى: طارق المنصور</span>
            <span>الموضوع: متابعة مكالمة اليوم · تحسين مسارات أسطول أبكس</span>
          </div>
          {ordered.length ? ordered.map((block) => <p key={block.id} className="m-0">{block.text}</p>) : <p className="m-0 text-fg-muted">الإيميل فارغ.</p>}
          <p className={cn("m-0 text-fg-muted")}>مع التحية،</p>
        </div>
        <div className="flex justify-end">
          <Button disabled={!ordered.length} onClick={() => onDone(picked)}>
            أرسل الإيميل
          </Button>
        </div>
      </LabPanel>
    </div>
  );
}
