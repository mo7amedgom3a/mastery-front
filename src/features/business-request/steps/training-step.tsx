"use client";

import { ChoiceGroup, Reveal } from "../components/choice-group";
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
        required
        choices={trainingTypes}
        isSelected={(value) => types.includes(value)}
        onToggle={(value) => update({ trainingTypes: toggleValue(types, value) })}
        error={errors.trainingTypes}
      />
      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="الهدف من التدريب"
          required
          choices={trainingGoals}
          isSelected={(value) => goals.includes(value)}
          onToggle={(value) => update({ trainingGoals: toggleValue(goals, value) })}
          error={errors.trainingGoals}
        />
        <Reveal show={goals.includes("other")}>
          <TextField name="otherTrainingGoal" label="الهدف الآخر من التدريب" required />
        </Reveal>
      </div>
      <div className="sm:max-w-xs">
        <TextField name="teamSize" label="عدد الموظفين المطلوب تدريبهم" type="number" inputMode="numeric" min={1} dir="ltr" required />
      </div>
    </RequestFrame>
  );
}
