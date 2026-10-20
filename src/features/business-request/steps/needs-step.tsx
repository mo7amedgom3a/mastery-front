"use client";

import type { CatalogCategoriesResponse, OnboardingSkill } from "@/lib/api/catalog";

import { ChoiceGroup } from "../components/choice-group";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { toggleValue, useRequestStore } from "../model/request-store";

type NeedsStepProps = { categories: CatalogCategoriesResponse; skills: readonly OnboardingSkill[] };

export function NeedsStep({ categories, skills }: NeedsStepProps) {
  const categoryIds = useRequestStore((state) => state.categoryIds);
  const skillIds = useRequestStore((state) => state.skillIds);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);
  const unavailable = categories.length === 0 || skills.length === 0;

  return (
    <RequestFrame
      step="needs"
      title="المجالات والمهارات المطلوبة"
      lead="اختر ما يناسب فريقك، واكتب لنا باختصار ما تحتاجونه."
      disabled={unavailable}
    >
      {unavailable ? (
        <p className="ma-alert ma-alert--danger" role="alert">
          تعذّر تحميل المجالات والمهارات حالياً. حاول تحديث الصفحة.
        </p>
      ) : null}
      <ChoiceGroup
        legend="المجالات المطلوبة"
        choices={categories.map((category) => ({ value: category.category_id, label: category.name ?? category.slug }))}
        isSelected={(value) => categoryIds.includes(value)}
        onToggle={(value) => update({ categoryIds: toggleValue(categoryIds, value) })}
        error={errors.categoryIds}
      />
      <ChoiceGroup
        legend="المهارات التي يحتاجها الفريق"
        choices={skills.map((skill) => ({ value: skill.skill_id, label: skill.name }))}
        isSelected={(value) => skillIds.includes(value)}
        onToggle={(value) => update({ skillIds: toggleValue(skillIds, value) })}
        error={errors.skillIds}
      />
      <TextField name="summary" label="ملخص الاحتياج التدريبي" multiline />
    </RequestFrame>
  );
}
