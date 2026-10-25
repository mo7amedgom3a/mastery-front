"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";

import { routes } from "@/config/routes";
import { b2bFormCopy } from "@/features/business/content/b2b";
import { ChoiceChip } from "@/features/onboarding/components/choice-chip";
import type { CatalogCategoriesResponse, OnboardingSkill } from "@/lib/api/catalog";

import { submitCompanyRequest } from "../actions/submit-request";
import { ChoiceGroup, Reveal } from "../components/choice-group";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { answersOf, toggleValue, useRequestStore } from "../model/request-store";
import { groupRequestSkills } from "../model/skill-groups";
import { firstStepWith } from "../model/schema";

type NeedsStepProps = { categories: CatalogCategoriesResponse; skills: readonly OnboardingSkill[] };

export function NeedsStep({ categories, skills }: NeedsStepProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const id = useId();
  const categoryIds = useRequestStore((state) => state.categoryIds);
  const otherCategorySelected = useRequestStore((state) => state.otherCategorySelected);
  const skillIds = useRequestStore((state) => state.skillIds);
  const otherSkillSelected = useRequestStore((state) => state.otherSkillSelected);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);
  const unavailable = categories.length === 0 || skills.length === 0;

  const groups = useMemo(() => groupRequestSkills(categories, skills, categoryIds, otherCategorySelected), [categories, skills, categoryIds, otherCategorySelected]);
  const visibleIds = useMemo(() => new Set(groups.flatMap((group) => [...group.arabic, ...group.english].map((skill) => skill.skill_id))), [groups]);

  // A category change cannot leave a selected skill hidden in the submitted answer.
  useEffect(() => {
    const visible = skillIds.filter((skillId) => visibleIds.has(skillId));
    if (visible.length !== skillIds.length) update({ skillIds: visible });
  }, [skillIds, visibleIds, update]);

  const submit = () => startTransition(async () => {
    setSubmitError(null);
    const store = useRequestStore.getState();
    const result = await submitCompanyRequest(answersOf(store), store.draftToken);
    if (result.status === "success") {
      router.push(routes.businessRequestDone);
      store.reset();
      return;
    }
    if (result.status === "invalid") {
      store.setErrors(result.errors);
      const step = firstStepWith(result.errors);
      if (step && step !== "needs") {
        store.setDirection(-1);
        router.push(routes.businessRequest(step));
      }
      return;
    }
    setSubmitError(result.message);
  });

  return (
    <RequestFrame
      step="needs"
      title="المجالات والمهارات المطلوبة"
      lead="اختر ما يناسب فريقك، واكتب لنا باختصار ما تحتاجونه."
      disabled={unavailable}
      onNext={submit}
      nextLabel={b2bFormCopy.submit}
      pending={pending}
      error={submitError}
    >
      {unavailable ? (
        <p className="ma-alert ma-alert--danger" role="alert">
          تعذّر تحميل المجالات والمهارات حالياً. حاول تحديث الصفحة.
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="المجالات المطلوبة"
          required
          choices={[...categories.map((category) => ({ value: category.category_id, label: category.name ?? category.slug })), { value: "other", label: "أخرى" }]}
          isSelected={(value) => value === "other" ? otherCategorySelected : categoryIds.includes(value)}
          onToggle={(value) => {
            if (value === "other") update({ otherCategorySelected: !otherCategorySelected });
            else update({ categoryIds: toggleValue(categoryIds, value) });
          }}
          error={errors.categoryIds}
        />
        <Reveal show={otherCategorySelected}>
          <TextField name="otherCategory" label="المجال الآخر" required />
        </Reveal>
      </div>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" data-invalid={errors.skillIds ? "" : undefined} aria-describedby={errors.skillIds ? `${id}-error` : undefined}>
        <legend className="mb-3 p-0 font-bold">المهارات التي يحتاجها الفريق <span className="ms-1 text-pink" aria-label="مطلوب">*</span></legend>
        {groups.map((group) => group.arabic.length + group.english.length > 0 ? (
          <div key={group.id} className="flex flex-col gap-3">
            <h3 className="m-0 text-sm font-semibold text-fg-muted">{group.name}</h3>
            {([true, false] as const).map((arabic) => {
              const subset = arabic ? group.arabic : group.english;
              return subset.length > 0 ? (
                <div key={String(arabic)} className="flex flex-col gap-2">
                  <p className="m-0 text-xs text-fg-muted">{arabic ? "مهارات بالعربية" : "Skills in English"}</p>
                  <div className="flex flex-wrap gap-2">
                    {subset.map((skill) => (
                      <ChoiceChip key={skill.skill_id} selected={skillIds.includes(skill.skill_id)} onToggle={() => update({ skillIds: toggleValue(skillIds, skill.skill_id) })}>
                        {skill.name}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        ) : null)}
        {categoryIds.length === 0 && !otherCategorySelected ? <p className="m-0 text-sm text-fg-muted">اختر مجالاً لعرض المهارات المرتبطة به.</p> : null}
        {groups.length > 0 && groups.every((group) => group.arabic.length + group.english.length === 0) ? <p className="m-0 text-sm text-fg-muted">لا توجد مهارات مرتبطة بهذه المجالات حالياً. يمكنك كتابة مهارة أخرى.</p> : null}
        <div className="flex flex-wrap gap-2">
          <ChoiceChip selected={otherSkillSelected} onToggle={() => update({ otherSkillSelected: !otherSkillSelected })}>أخرى</ChoiceChip>
        </div>
        {errors.skillIds ? <p id={`${id}-error`} role="alert" className="ma-help m-0 text-pink">{errors.skillIds}</p> : null}
      </fieldset>
      <Reveal show={otherSkillSelected}>
        <TextField name="otherSkill" label="المهارة الأخرى" required />
      </Reveal>
      <TextField name="summary" label="ملخص الاحتياج التدريبي" multiline />
    </RequestFrame>
  );
}
