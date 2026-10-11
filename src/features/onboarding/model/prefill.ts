import type {
  LearningProfileResponse,
  OnboardingQuestionsResponse,
  SavedOnboardingAnswers,
} from "@/lib/api/customers";

import { useOnboardingStore, type OnboardingAnswers } from "./onboarding-store";

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * What the customer told us, rebuilt from the saved learning profile and onboarding answers. The
 * profile holds goal, domain, level, minutes and target skills; the rest (skills already mastered,
 * topics, product types) travels in the skills answer's `raw_answer` (see `buildAnswers`).
 */
export function savedAnswers(
  profile: LearningProfileResponse | undefined,
  answers: SavedOnboardingAnswers | undefined,
  questions: OnboardingQuestionsResponse | undefined,
): OnboardingAnswers {
  const codeById = new Map((questions ?? []).map((question) => [question.question_id, question.code]));
  const byCode = new Map((answers ?? []).map((answer) => [codeById.get(answer.question_id), answer]));
  const skillsRaw = (byCode.get("target_skills")?.raw_answer ?? {}) as Record<string, unknown>;
  const minutes = profile?.daily_study_minutes ?? skillsRaw.daily_study_minutes;

  return {
    goal: profile?.goal ?? byCode.get("learning_goal")?.answer_text ?? "",
    domain: profile?.domain ?? null,
    targetSkillIds: (profile?.target_skills ?? []).map((item) => item.skill_id),
    currentSkillIds: strings(skillsRaw.current_skill_ids),
    level: profile?.current_level ?? byCode.get("current_level")?.answer_key ?? null,
    dailyMinutes: typeof minutes === "number" ? minutes : null,
    tags: strings(skillsRaw.tags),
    productTypes: strings(skillsRaw.product_types),
  };
}

/** Loads saved answers into the onboarding flow, so editing starts from what was chosen. */
export function prefillOnboarding(answers: OnboardingAnswers): void {
  const store = useOnboardingStore.getState();
  store.reset();
  store.update(answers);
}
