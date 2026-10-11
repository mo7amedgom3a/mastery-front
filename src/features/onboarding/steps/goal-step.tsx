"use client";

import { useId } from "react";

import type { OnboardingSkill } from "@/lib/api/catalog";

import { ChoiceChip } from "../components/choice-chip";
import { StepFrame } from "../components/step-frame";
import { useOnboardingStore } from "../model/onboarding-store";

const GOAL_MAX = 500;

export function GoalStep({ skills }: { skills: readonly OnboardingSkill[] }) {
  const goal = useOnboardingStore((state) => state.goal);
  const domain = useOnboardingStore((state) => state.domain);
  const update = useOnboardingStore((state) => state.update);
  const goalId = useId();
  const domains = skills.filter((skill) => !skill.parent_skill_id);

  return (
    <StepFrame
      step="goal"
      title="ما الذي تريد تحقيقه؟"
      lead="أخبرنا بهدفك والمجال الذي يهمّك، لنقترح عليك نقطة بداية مناسبة."
      canContinue={Boolean(domain) || goal.trim().length >= 3}
    >
      <div className="ma-field">
        <label htmlFor={goalId} className="font-bold">
          هدفك من التعلّم
        </label>
        <textarea
          id={goalId}
          value={goal}
          maxLength={GOAL_MAX}
          rows={3}
          onChange={(event) => update({ goal: event.target.value })}
          placeholder="مثلاً: أريد الانتقال إلى وظيفة في التسويق الرقمي خلال ستة أشهر"
          className="ma-input min-h-28 resize-y py-3 leading-7"
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">المجال الأقرب إليك</legend>
        <div className="flex flex-wrap gap-2">
          {domains.map((skill) => (
            <ChoiceChip
              key={skill.skill_id}
              selected={domain === skill.slug}
              onToggle={() => update({ domain: domain === skill.slug ? null : skill.slug })}
            >
              {skill.name}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
    </StepFrame>
  );
}
