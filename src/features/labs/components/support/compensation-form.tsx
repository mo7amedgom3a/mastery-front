"use client";

import { ClipboardCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import {
  AGENT_LIMIT,
  caseNotes,
  compensationCost,
  compensationDoc,
  emptyForm,
  goodwillOptions,
  needsSupervisor,
  resolutions,
  type CompensationForm,
  type Triage,
} from "../../content/support";
import { LabPanel, OptionCard } from "../bits";
import { DocumentViewer } from "../documents/document-viewer";

/** Resolution phase: fill the compensation form (rendered live as a PDF) and write the case note. */
export function CompensationStep({ triage, onDone }: { triage: Triage; onDone: (form: CompensationForm, notes: string[]) => void }) {
  const [form, setForm] = useState<CompensationForm>(emptyForm);
  const [notes, setNotes] = useState<string[]>([]);
  const set = <K extends keyof CompensationForm>(key: K, value: CompensationForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const over = needsSupervisor(form);
  const cost = compensationCost(form);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <LabPanel title="نموذج التعويض" subtitle={`ما يُعتمد هنا يُنفّذ فورًا. صلاحيتك حتى ${AGENT_LIMIT} ر.س تعويضًا.`}>
          <OptionCard multi selected={form.refundDouble} onSelect={() => set("refundDouble", !form.refundDouble)} title="رد الخصم المكرر (4,299 ر.س)" detail="تصحيح مالي، لا يُحتسب تعويضًا" />
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">الحل</legend>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {resolutions.map((r) => (
                <OptionCard key={r.id} selected={form.resolution === r.id} onSelect={() => set("resolution", r.id)} title={r.label} />
              ))}
            </div>
          </fieldset>
          <div className="grid gap-2 sm:grid-cols-2">
            <OptionCard multi selected={form.priority} onSelect={() => set("priority", !form.priority)} title="توصيل بأولوية" detail="خلال 48 ساعة" />
            <OptionCard multi selected={form.pickup} onSelect={() => set("pickup", !form.pickup)} title="استلام التالف مجانًا" />
          </div>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">رصيد تعويضي</legend>
            <div role="radiogroup" className="grid grid-cols-5 gap-2">
              {goodwillOptions.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={form.goodwill === g}
                  onClick={() => set("goodwill", g)}
                  className={cn(
                    "rounded-photo border py-2 text-sm tabular-nums",
                    form.goodwill === g ? "border-accent bg-accent/10 font-bold" : "border-line hover:border-line-strong",
                    g > AGENT_LIMIT && "text-pink",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </fieldset>
          <OptionCard
            multi
            selected={form.supervisor}
            onSelect={() => set("supervisor", !form.supervisor)}
            title="طلب اعتماد المشرف"
            detail={over ? `مطلوب: التعويض ${cost} ر.س يتجاوز صلاحيتك` : "غير مطلوب ضمن صلاحيتك"}
            className={over && !form.supervisor ? "border-pink" : undefined}
          />
        </LabPanel>

        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="size-5 text-sky" aria-hidden /> ملاحظة التذكرة الداخلية
            </span>
          }
          subtitle="اختر ما حدث فعلًا في المحادثة فقط. من يستلم التذكرة بعدك يعتمد عليها."
        >
          <div className="flex flex-col gap-2">
            {caseNotes.map((note) => (
              <OptionCard
                key={note.id}
                multi
                selected={notes.includes(note.id)}
                onSelect={() => setNotes((c) => (c.includes(note.id) ? c.filter((x) => x !== note.id) : [...c, note.id]))}
                title={note.label}
              />
            ))}
          </div>
          <Button size="lg" block disabled={!form.resolution} onClick={() => onDone(form, notes)}>
            اعتمد النموذج وأغلق التذكرة
          </Button>
        </LabPanel>
      </div>
      <DocumentViewer doc={compensationDoc(form, triage, false)} fileName="نموذج-اعتماد-تعويض-48213.pdf" className="xl:sticky xl:top-[calc(var(--header-h)+16px)] xl:self-start" />
    </div>
  );
}
