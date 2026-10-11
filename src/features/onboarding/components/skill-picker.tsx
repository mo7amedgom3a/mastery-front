"use client";

import type { OnboardingSkill } from "@/lib/api/catalog";

import { ChoiceChip } from "./choice-chip";

type SkillGroup = { root: OnboardingSkill; skills: OnboardingSkill[] };

/** Skills grouped under their root skill (the domain); a root without children is its own choice. */
export function groupSkills(skills: readonly OnboardingSkill[]): SkillGroup[] {
  const roots = skills.filter((skill) => !skill.parent_skill_id);
  return roots.map((root) => {
    const children = skills.filter((skill) => skill.parent_skill_id === root.skill_id);
    return { root, skills: children.length > 0 ? children : [root] };
  });
}

type SkillPickerProps = {
  skills: readonly OnboardingSkill[];
  selected: readonly string[];
  onToggle: (skillId: string) => void;
  /** Skills chosen in another step, left out here. */
  exclude?: readonly string[];
  /** Slug of the domain to list first (the one picked as the goal). */
  firstDomain?: string | null;
};

export function SkillPicker({ skills, selected, onToggle, exclude = [], firstDomain }: SkillPickerProps) {
  const groups = groupSkills(skills)
    .map((group) => ({ ...group, skills: group.skills.filter((skill) => !exclude.includes(skill.skill_id)) }))
    .filter((group) => group.skills.length > 0)
    .sort((a, b) => Number(b.root.slug === firstDomain) - Number(a.root.slug === firstDomain));

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ root, skills: options }) => (
        <fieldset key={root.skill_id} className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0 font-bold">{root.name}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((skill) => (
              <ChoiceChip
                key={skill.skill_id}
                selected={selected.includes(skill.skill_id)}
                onToggle={() => onToggle(skill.skill_id)}
              >
                {skill.name}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
