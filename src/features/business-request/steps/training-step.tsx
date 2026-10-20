"use client";

import { ChoiceGroup } from "../components/choice-group";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { trainingGoals, trainingTypes } from "../model/options";
import { toggleValue, useRequestStore } from "../model/request-store";

export function TrainingStep() {
  const types = useRequestStore((state) => state.trainingTypes);
  const goals = useRequestStore((state) => state.trainingGoals);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);

  return (
    <RequestFrame step="training" title="ما التدريب الذي تحتاجونه؟" lead="يمكنك اختيار أكثر من إجابة في كل سؤال.">
      <ChoiceGroup
        legend="نوع التدريب"
        choices={trainingTypes}
        isSelected={(value) => types.includes(value)}
        onToggle={(value) => update({ trainingTypes: toggleValue(types, value) })}
        error={errors.trainingTypes}
      />
      <ChoiceGroup
        legend="الهدف من التدريب"
        choices={trainingGoals}
        isSelected={(value) => goals.includes(value)}
        onToggle={(value) => update({ trainingGoals: toggleValue(goals, value) })}
        error={errors.trainingGoals}
      />
      <div className="sm:max-w-xs">
        <TextField name="teamSize" label="عدد الموظفين المطلوب تدريبهم" type="number" inputMode="numeric" min={1} dir="ltr" />
      </div>
    </RequestFrame>
  );
}
