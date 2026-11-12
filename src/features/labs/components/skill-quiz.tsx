"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgressTrack } from "@/features/student-dashboard/components/progress-track";
import { cn } from "@/lib/cn";

import { scoreQuiz } from "../model/scoring";
import type { QuizQuestion, QuizResult } from "../model/types";
import { LabPanel } from "./bits";

/**
 * One question at a time. `pre` is a situational-judgement profile (no right/wrong shown, only
 * the explanation); `post` is a knowledge check that marks the answer.
 */
export function SkillQuiz({
  mode,
  questions,
  onDone,
}: {
  mode: "pre" | "post";
  questions: readonly QuizQuestion[];
  onDone: (result: QuizResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const question = questions[index];
  const picked = answers[index];
  const answered = picked !== undefined;
  const last = index === questions.length - 1;
  const best = Math.max(...question.options.map((o) => o.points));

  const pick = (option: number) => {
    if (answered) return;
    setAnswers((current) => {
      const next = [...current];
      next[index] = option;
      return next;
    });
  };

  const advance = () => {
    if (last) onDone(scoreQuiz(questions, answers));
    else setIndex(index + 1);
  };

  return (
    <LabPanel
      title={mode === "pre" ? "قبل أن تبدأ: كيف تتصرف عادة؟" : "تحقق سريع مما تعلّمته"}
      subtitle={
        mode === "pre" ? "لا توجد إجابة خاطئة هنا؛ نرسم نمطك لنقارنه بأدائك في المحاكاة." : "3 أسئلة تقيس ما ترسّخ بعد التجربة."
      }
      className="mx-auto w-full max-w-3xl"
    >
      <ProgressTrack value={index + (answered ? 1 : 0)} max={questions.length} label={`سؤال ${index + 1} من ${questions.length}`} valueLabel=" " />
      <p className="m-0 text-lg leading-8 font-bold">{question.prompt}</p>
      <div role="radiogroup" aria-label={question.prompt} className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isPicked = picked === i;
          const showMark = mode === "post" && answered && (isPicked || option.points === best);
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={answered && !isPicked}
              onClick={() => pick(i)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-photo border p-3 text-start text-sm leading-6 transition-colors",
                isPicked ? "border-accent bg-accent/10 font-semibold" : "border-line hover:border-line-strong",
                answered && !isPicked && "opacity-60",
              )}
            >
              <span>{option.label}</span>
              {showMark ? (
                option.points === best ? (
                  <CircleCheck className="size-5 shrink-0 text-green" aria-label="الإجابة الأفضل" />
                ) : (
                  <CircleX className="size-5 shrink-0 text-pink" aria-label="ليست الأفضل" />
                )
              ) : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="flex flex-col gap-3">
          <p className="m-0 rounded-photo bg-surface-alt p-3 text-sm leading-7">{question.explain}</p>
          <div className="flex justify-end">
            <Button onClick={advance}>{last ? (mode === "pre" ? "ادخل المحاكاة" : "اعرض تقييمي") : "التالي"}</Button>
          </div>
        </div>
      ) : null}
    </LabPanel>
  );
}
