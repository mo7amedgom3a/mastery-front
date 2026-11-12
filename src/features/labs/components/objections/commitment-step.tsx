"use client";

import { Handshake, NotebookPen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { ObjectionCrmEntry, ObjectionScenario } from "../../content/objections/types";
import { LabPanel, OptionCard } from "../bits";

/** Choose the commitment the customer actually made. */
export function CommitmentStep({
  scenario,
  onDone,
}: {
  scenario: ObjectionScenario;
  onDone: (commitment: string) => void;
}) {
  const [commitment, setCommitment] = useState<string | null>(null);
  const picked = scenario.commitment.options.find((option) => option.id === commitment) ?? null;

  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Handshake className="size-5 text-green" aria-hidden /> الالتزام
        </span>
      }
      subtitle="ماذا وافق العميل عليه فعلًا؟ اختر الالتزام الأقرب لما حدث، لا الأجمل."
      className="mx-auto w-full max-w-3xl"
    >
      <div className="flex flex-col gap-2">
        {scenario.commitment.options.map((option) => (
          <OptionCard
            key={option.id}
            selected={commitment === option.id}
            onSelect={() => setCommitment(option.id)}
            title={option.label}
          />
        ))}
      </div>
      {picked?.note ? (
        <p className="m-0 rounded-photo bg-surface-alt p-3 text-[13px] leading-6 text-fg-muted">{picked.note.text}</p>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={!commitment} onClick={() => commitment && onDone(commitment)}>
          التالي: وثّق في الـCRM
        </Button>
      </div>
    </LabPanel>
  );
}

/** Record the stage, next step and truthful notes. */
export function CrmStep({
  scenario,
  onDone,
}: {
  scenario: ObjectionScenario;
  onDone: (entry: ObjectionCrmEntry) => void;
}) {
  const [stage, setStage] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const ready = Boolean(stage && nextStep);

  const toggleNote = (id: string) => {
    setNotes((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <NotebookPen className="size-5 text-sky" aria-hidden /> التوثيق في الـCRM
        </span>
      }
      subtitle="سجّل المرحلة والخطوة والملاحظات كما حدثت."
      className="mx-auto w-full max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">المرحلة</span>
          <select className="ma-select" value={stage ?? ""} onChange={(event) => setStage(event.target.value || null)}>
            <option value="">اختر المرحلة…</option>
            {scenario.crm.stages.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">الخطوة التالية</span>
          <select className="ma-select" value={nextStep ?? ""} onChange={(event) => setNextStep(event.target.value || null)}>
            <option value="">اختر الخطوة…</option>
            {scenario.crm.nextSteps.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold">ملاحظات المكالمة</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {scenario.crm.notes.map((note) => (
            <OptionCard
              key={note.id}
              multi
              selected={notes.includes(note.id)}
              onSelect={() => toggleNote(note.id)}
              title={note.label}
            />
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button disabled={!ready} onClick={() => ready && onDone({ stage, nextStep, notes })}>
          احفظ المتابعة
        </Button>
      </div>
    </LabPanel>
  );
}
