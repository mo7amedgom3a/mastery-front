"use client";

import { useQuery } from "@tanstack/react-query";

import { customerQueries } from "@/lib/api/customers";
import { cn } from "@/lib/cn";

import { ChoiceChip } from "../components/choice-chip";
import { StepFrame } from "../components/step-frame";
import { DAILY_MINUTES, DEFAULT_LEVELS, LEVEL_LABELS, parseOptions } from "../model/labels";
import { useOnboardingStore } from "../model/onboarding-store";

export function LevelStep() {
  const level = useOnboardingStore((state) => state.level);
  const minutes = useOnboardingStore((state) => state.dailyMinutes);
  const update = useOnboardingStore((state) => state.update);
  // The level choices come from the backend's question when it has them.
  const questions = useQuery(customerQueries.onboardingQuestions());
  const fromQuestion = parseOptions(questions.data?.find((question) => question.code === "current_level")?.options_json);
  const levels = fromQuestion.length > 0 ? fromQuestion : DEFAULT_LEVELS;

  return (
    <StepFrame step="level" title="ما مستواك الحالي؟" lead="ونحو كم من الوقت يمكنك أن تخصّص للتعلّم يومياً؟" canContinue={Boolean(level)}>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">مستواك</legend>
        <div role="radiogroup" aria-label="مستواك" className="grid gap-3 sm:grid-cols-3">
          {levels.map((value) => {
            const copy = LEVEL_LABELS[value] ?? { label: value, hint: "" };
            const checked = level === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => update({ level: value })}
                className={cn(
                  "flex min-h-24 cursor-pointer flex-col items-start gap-1 rounded-panel border-2 bg-surface p-4 text-start font-[inherit] text-fg transition-colors",
                  checked ? "border-accent" : "border-line hover:border-line-strong",
                )}
              >
                <span className="text-lg font-bold">{copy.label}</span>
                {copy.hint ? <span className="text-sm leading-6 text-fg-muted">{copy.hint}</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">وقت التعلّم اليومي (اختياري)</legend>
        <div className="flex flex-wrap gap-2">
          {DAILY_MINUTES.map((value) => (
            <ChoiceChip
              key={value}
              selected={minutes === value}
              onToggle={() => update({ dailyMinutes: minutes === value ? null : value })}
            >
              {value < 60 ? `${value} دقيقة` : value === 60 ? "ساعة" : "ساعة ونصف"}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
    </StepFrame>
  );
}
