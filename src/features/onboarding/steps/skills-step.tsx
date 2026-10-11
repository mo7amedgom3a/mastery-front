"use client";

import type { OnboardingSkill } from "@/lib/api/catalog";
import { formatCount } from "@/lib/format";

import { SkillPicker } from "../components/skill-picker";
import { StepFrame } from "../components/step-frame";
import { toggleId, useOnboardingStore } from "../model/onboarding-store";

const SKILL_FORMS = { one: "مهارة واحدة", two: "مهارتان", few: "مهارات", many: "مهارة" };

/** The skill gaps: what the customer wants to learn. These drive the recommendations. */
export function SkillsStep({ skills }: { skills: readonly OnboardingSkill[] }) {
  const selected = useOnboardingStore((state) => state.targetSkillIds);
  const current = useOnboardingStore((state) => state.currentSkillIds);
  const domain = useOnboardingStore((state) => state.domain);
  const update = useOnboardingStore((state) => state.update);

  const toggle = (skillId: string) =>
    update({
      targetSkillIds: toggleId(selected, skillId),
      // A skill to learn is not also one already mastered.
      currentSkillIds: current.filter((id) => id !== skillId),
    });

  return (
    <StepFrame
      step="skills"
      title="ما المهارات التي تريد اكتسابها؟"
      lead="اختر المهارات التي تنقصك وتريد بناءها. سنبني اقتراحاتك عليها."
      canContinue={selected.length > 0}
    >
      <p aria-live="polite" className="m-0 text-sm text-fg-muted">
        {selected.length > 0 ? `اخترت ${formatCount(selected.length, SKILL_FORMS)}` : "اختر مهارة واحدة على الأقل"}
      </p>
      <SkillPicker skills={skills} selected={selected} onToggle={toggle} firstDomain={domain} />
    </StepFrame>
  );
}
