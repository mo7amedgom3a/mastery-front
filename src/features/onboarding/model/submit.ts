import {
  completeOnboarding,
  getOnboardingQuestions,
  upsertLearningProfile,
  type OnboardingAnswersRequest,
  type OnboardingQuestionsResponse,
} from "@/lib/api/customers";

import type { OnboardingAnswers } from "./onboarding-store";

type Answer = OnboardingAnswersRequest["answers"][number];

/**
 * The answers for the backend's onboarding questions, matched by `code`. Questions that don't exist
 * are left out. What the backend has no field for (skills already mastered, preferred topics and
 * product types) travels in the skills answer's `raw_answer`.
 */
export function buildAnswers(questions: OnboardingQuestionsResponse, answers: OnboardingAnswers): Answer[] {
  const byCode = new Map(questions.filter((question) => question.is_active).map((question) => [question.code, question]));
  const result: Answer[] = [];

  const goal = byCode.get("learning_goal");
  if (goal && answers.goal.trim()) {
    result.push({
      question_id: goal.question_id,
      answer_text: answers.goal.trim(),
      selected_skill_ids: [],
      raw_answer: { domain: answers.domain },
    });
  }

  const skills = byCode.get("target_skills");
  if (skills) {
    result.push({
      question_id: skills.question_id,
      selected_skill_ids: answers.targetSkillIds,
      raw_answer: {
        current_skill_ids: answers.currentSkillIds,
        tags: answers.tags,
        product_types: answers.productTypes,
        daily_study_minutes: answers.dailyMinutes,
      },
    });
  }

  const level = byCode.get("current_level");
  if (level && answers.level) {
    result.push({ question_id: level.question_id, answer_key: answers.level, selected_skill_ids: [], raw_answer: {} });
  }

  return result;
}

/**
 * Saves the learning profile, then the answers (which mark onboarding complete). In that order so a
 * failure part-way never leaves onboarding "complete" without the profile it describes.
 */
export async function submitOnboarding(answers: OnboardingAnswers): Promise<void> {
  const questions = await getOnboardingQuestions();
  await upsertLearningProfile({
    goal: answers.goal.trim() || null,
    domain: answers.domain,
    current_level: answers.level,
    daily_study_minutes: answers.dailyMinutes,
    target_skill_ids: answers.targetSkillIds,
  });
  await completeOnboarding({ answers: buildAnswers(questions, answers) });
}
