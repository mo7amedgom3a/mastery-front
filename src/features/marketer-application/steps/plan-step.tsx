"use client";

import { useId } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import { ChoiceChip } from "@/features/onboarding/components/choice-chip";

import { ApplyFrame } from "../components/apply-frame";
import { useApplyStore, type YesNo } from "../model/apply-store";

const PLAN_HINT = "مثال: مراجعات للبرامج التدريبية، مقالات، حملات لجمهورك المستهدف";

function YesNoQuestion({ label, value, onChange }: { label: string; value: YesNo; onChange: (value: YesNo) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-ctl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-fg">{label}</span>
      <div className="flex shrink-0 items-center gap-2" role="group" aria-label={label}>
        <ChoiceChip selected={value === "yes"} onToggle={() => onChange("yes")}>نعم</ChoiceChip>
        <ChoiceChip selected={value === "no"} onToggle={() => onChange("no")}>لا</ChoiceChip>
      </div>
    </div>
  );
}

export function PlanStep() {
  const id = useId();
  const { hasEmailList, isInfluencer, audienceSize, marketingPlan, errors, update } = useApplyStore();
  return (
    <ApplyFrame step="plan" title="جمهورك وخطتك" lead="ساعدنا نفهم من تصل إليهم وكيف ستروّج لبرامج ماستري.">
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <YesNoQuestion label="هل تملك نشرة أو قائمة بريدية؟" value={hasEmailList} onChange={(v) => update({ hasEmailList: v })} />
          <YesNoQuestion label="هل أنت صانع محتوى / مؤثر؟" value={isInfluencer} onChange={(v) => update({ isInfluencer: v })} />
        </div>
        <Field id={`${id}-audience`} label="حجم الجمهور أو المتابعين التقريبي" hint="مثال: 15,000 متابع على X، أو 5,000 مشترك في النشرة البريدية">
          <input id={`${id}-audience`} maxLength={40} value={audienceSize} onChange={(e) => update({ audienceSize: e.target.value })} placeholder="مثال: 20 ألف متابع" className="ma-input" />
        </Field>
        <Field id={`${id}-plan`} label="كيف تخطط للترويج لدورات وبرامج ماستري؟" error={errors.marketingPlan} hint={PLAN_HINT} required>
          <textarea
            id={`${id}-plan`}
            rows={5}
            maxLength={3000}
            value={marketingPlan}
            onChange={(e) => update({ marketingPlan: e.target.value })}
            placeholder="اكتب نبذة عن خطتك لترويج البرامج التدريبية والجمهور المستهدف…"
            {...describedBy(`${id}-plan`, errors.marketingPlan, PLAN_HINT)}
            className="ma-input"
          />
        </Field>
      </div>
    </ApplyFrame>
  );
}
