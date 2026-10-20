"use client";

import { ChoiceGroup, Reveal } from "../components/choice-group";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { budgetChoices, platforms } from "../model/options";
import { toggleValue, useRequestStore } from "../model/request-store";

const yesNo = [
  { value: true, label: "نعم" },
  { value: false, label: "لا" },
] as const;

export function BudgetStep() {
  const hasBudget = useRequestStore((state) => state.hasTrainingBudget);
  const usedBefore = useRequestStore((state) => state.usedPlatformBefore);
  const previous = useRequestStore((state) => state.previousPlatforms);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);

  return (
    <RequestFrame step="budget" title="الميزانية والتجارب السابقة" lead="تساعدنا إجاباتك على اقتراح عرض يناسب طريقة عمل شركتك.">
      <ChoiceGroup
        legend="هل لدى الشركة ميزانية مخصّصة للتدريب؟"
        hint="اختياري"
        choices={budgetChoices}
        isSelected={(value) => hasBudget === value}
        onToggle={(value) => update({ hasTrainingBudget: hasBudget === value ? null : value })}
        stacked
      />

      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="هل سبق أن اشتركتم في منصة تدريب من قبل؟"
          choices={yesNo}
          isSelected={(value) => usedBefore === value}
          onToggle={(value) => update({ usedPlatformBefore: usedBefore === value ? null : value })}
          error={errors.usedPlatformBefore}
        />
        <Reveal show={usedBefore === true}>
          <div className="flex flex-col gap-4 pt-4">
            <ChoiceGroup
              legend="اختر المنصات"
              choices={platforms}
              isSelected={(value) => previous.includes(value)}
              onToggle={(value) => update({ previousPlatforms: toggleValue(previous, value) })}
              error={errors.previousPlatforms}
            />
            <Reveal show={previous.includes("other")}>
              <TextField name="otherPlatform" label="اسم المنصة" />
            </Reveal>
          </div>
        </Reveal>
      </div>
    </RequestFrame>
  );
}
