"use client";

import type { OnboardingSkill } from "@/lib/api/catalog";

import { SkillPicker } from "../components/skill-picker";
import { StepFrame } from "../components/step-frame";
import { toggleId, useOnboardingStore } from "../model/onboarding-store";

/** Skills the customer already has (optional); kept with the onboarding answers. */
export function StrengthsStep({ skills }: { skills: readonly OnboardingSkill[] }) {
  const selected = useOnboardingStore((state) => state.currentSkillIds);
  const targets = useOnboardingStore((state) => state.targetSkillIds);
  const domain = useOnboardingStore((state) => state.domain);
  const update = useOnboardingStore((state) => state.update);

  return (
    <StepFrame
      step="strengths"
      title="ما المهارات التي تتقنها بالفعل؟"
      lead="اختياري: يساعدنا على تجنّب اقتراح ما تعرفه مسبقاً."
      canContinue
      nextLabel={selected.length > 0 ? "التالي" : "تخطَّ هذه الخطوة"}
    >
      <SkillPicker
        skills={skills}
        selected={selected}
        exclude={targets}
        firstDomain={domain}
        onToggle={(skillId) => update({ currentSkillIds: toggleId(selected, skillId) })}
      />
    </StepFrame>
  );
}
