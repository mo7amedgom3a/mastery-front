"use client";

import { ChoiceGroup, Reveal } from "../components/choice-group";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { departments, toggleDepartment } from "../model/options";
import { useRequestStore } from "../model/request-store";

export function DepartmentsStep() {
  const selected = useRequestStore((state) => state.departments);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);

  return (
    <RequestFrame step="departments" title="أي الأقسام تحتاج التدريب؟" lead="اختر الأقسام المعنية، أو «جميع الأقسام».">
      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="الأقسام"
          choices={departments}
          isSelected={(value) => selected.includes(value)}
          onToggle={(value) => update({ departments: toggleDepartment(selected, value) })}
          error={errors.departments}
        />
        <Reveal show={selected.includes("other")}>
          <TextField name="otherDepartment" label="الأقسام الأخرى" hint="مثلاً: الشؤون القانونية، المشتريات" />
        </Reveal>
      </div>
    </RequestFrame>
  );
}
