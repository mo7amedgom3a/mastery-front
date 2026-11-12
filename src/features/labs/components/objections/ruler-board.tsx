"use client";

import { Ruler } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { RulerScenario } from "../../content/objections/types";
import { clock } from "../../model/scoring";
import { LabPanel, MeterBar, OptionCard, Pill } from "../bits";
import { ChatChoice, ChatFrame, type ChatEntry } from "../chat-frame";

type RulerDone = {
  steps: Record<string, string>;
  benefits: string[];
  trust: number;
  tension: number;
};

/** The five-step ruler as a two-person chat, with the 1–10 scale kept beside the conversation. */
export function RulerBoard({ scenario, onDone }: { scenario: RulerScenario; onDone: (done: RulerDone) => void }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [benefits, setBenefits] = useState<string[]>([]);
  const [showBenefits, setShowBenefits] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>(() => [
    { id: "ruler-open", who: "persona", text: scenario.steps[0].customerLine, at: clock(0) },
  ]);
  const [typing, setTyping] = useState(false);
  const seconds = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const nextAt = () => {
    seconds.current += 14;
    return clock(seconds.current);
  };

  const step = scenario.steps[index];
  const picked = step ? picks[step.id] : undefined;
  const pickedOption = step?.options.find((option) => option.id === picked) ?? null;
  const answered = scenario.steps.filter((entry) => Boolean(picks[entry.id]));
  const correctCount = answered.filter((entry) => entry.options.find((option) => option.id === picks[entry.id])?.correct).length;
  const wrongCount = answered.length - correctCount;
  const rating = picks.rating === "out-of-ten" ? 9 : null;

  const trust = Math.max(0, Math.min(100, 40 + correctCount * 8 - wrongCount * 6));
  const tension = Math.max(0, Math.min(100, 30 - correctCount * 5 + wrongCount * 6));

  const choose = (optionId: string) => {
    if (!step) return;
    setPicks((current) => ({ ...current, [step.id]: optionId }));
    const option = step.options.find((entry) => entry.id === optionId);
    setEntries((current) => [
      ...current.filter((entry) => entry.id !== `ruler-choice-${step.id}`),
      { id: `ruler-choice-${step.id}`, who: "learner", text: option?.label ?? "", at: nextAt() },
    ]);
  };

  const advance = () => {
    if (typing) return;
    if (index + 1 < scenario.steps.length) {
      const next = scenario.steps[index + 1];
      setTyping(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setEntries((current) => [
          ...current,
          { id: `ruler-line-${next.id}`, who: "persona", text: next.customerLine, at: nextAt() },
        ]);
        setTyping(false);
        setIndex(index + 1);
      }, 550);
      return;
    }
    setTyping(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEntries((current) => [
        ...current,
        { id: "ruler-closing", who: "persona", text: scenario.closing, at: nextAt() },
      ]);
      setTyping(false);
      setShowBenefits(true);
    }, 550);
  };

  const finish = () => {
    onDone({ steps: picks, benefits, trust, tension });
  };

  const toggleBenefit = (id: string) => {
    setBenefits((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  return (
    <ChatFrame
      title={`مكالمة مع ${scenario.contact.name}`}
      subtitle={
        showBenefits
          ? "اختر المزايا التي تعالج الفجوة التي سمّاها العميل، لا كل ما لديك."
          : `الخطوة ${index + 1} من ${scenario.steps.length} · اختر ردّك من الخيارات. كل خطوة تغيّر تقييم العميل ومسار الحوار.`
      }
      persona={scenario.contact}
      entries={entries}
      typing={typing}
      aside={
        <>
          <LabPanel
            title={
              <span className="inline-flex items-center gap-2">
                <Ruler className="size-5 text-purple" aria-hidden /> مسطرة العميل
              </span>
            }
            subtitle="تقييم العميل للمنافس من 10"
          >
            <div className="flex gap-1" aria-label={rating ? `العميل قيّم المنافس ${rating} من 10` : "لم يُسأل العميل بعد"}>
              {Array.from({ length: 10 }, (_, i) => {
                const filled = rating !== null && i < rating;
                return (
                  <span
                    key={i}
                    className={cn(
                      "flex h-9 flex-1 items-center justify-center rounded-[4px] border text-[12px] font-bold tabular-nums",
                      filled ? "border-accent bg-accent/20" : "border-dashed border-line text-fg-muted",
                      i === 9 && rating !== null ? "border-yellow bg-yellow/20" : null,
                    )}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
            <p className="m-0 text-sm leading-6 text-fg-muted">
              {rating !== null
                ? `المنافس ${rating}/10. الفجوة نقطة واحدة — وهي مدخلك للحوار، لا للهجوم.`
                : "اطرح سؤال التقييم أولًا؛ الرقم هو ما يفتح الفجوة."}
            </p>
            <MeterBar label="الثقة" value={trust} />
            <MeterBar label="التوتر" value={tension} invert />
          </LabPanel>
          <LabPanel title="ما قاله العميل" subtitle="الفجوة والأثر كما صاغهما هو">
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm leading-6">
              <li className={cn("rounded-photo border px-3 py-2", picks.gap === "what-missing" ? "border-green" : "border-line text-fg-muted")}>
                {picks.gap === "what-missing" ? "التقارير الضريبية تتأخر 10 أيام، والدعم ما يرد بسرعة." : "لم تُكشف الفجوة بعد."}
              </li>
              <li className={cn("rounded-photo border px-3 py-2", picks.amplify === "consequences" ? "border-green" : "border-line text-fg-muted")}>
                {picks.amplify === "consequences" ? "أسبوعان إضافيان في الإقفال، ومستخلص تأخر 300 ألف." : "لم يُضخَّم الأثر بعد."}
              </li>
              <li className={cn("rounded-photo border px-3 py-2", picks["what-if"] === "what-if-offer" ? "border-green" : "border-line text-fg-muted")}>
                {picks["what-if"] === "what-if-offer" ? "العميل سأل: «وش عندك؟» — الفجوة صارت فرصة." : "لم تُغلق الفجوة بسؤال «ماذا لو»."}
              </li>
            </ul>
          </LabPanel>
        </>
      }
    >
      {!showBenefits && step ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{step.title}</Pill>
            <Pill>{step.prompt}</Pill>
          </div>
          <div className="flex flex-col gap-2">
            {step.options.map((option) => (
              <ChatChoice
                key={option.id}
                selected={picked === option.id}
                onSelect={() => choose(option.id)}
                disabled={typing}
              >
                {option.label}
              </ChatChoice>
            ))}
          </div>
          {pickedOption ? (
            <div
              className={cn(
                "flex flex-col gap-1 rounded-photo p-3 text-sm leading-7",
                pickedOption.correct ? "bg-green/15" : "bg-pink/15",
              )}
            >
              <span className="font-bold">{pickedOption.correct ? "خطوة صحيحة." : "هذه الخطوة لا تبني المسطرة."}</span>
              <span>{pickedOption.why}</span>
              <div className="flex justify-end">
                <Button size="sm" onClick={advance} disabled={typing}>
                  {index + 1 === scenario.steps.length ? "إلى حاجز المزايا" : "الخطوة التالية"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showBenefits ? (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            الفجوة التي كشفها العميل: <strong className="text-fg">{picks.gap === "what-missing" ? "تقارير ضريبية متأخرة ودعم بطيء" : "لم تُكشف بوضوح"}</strong>. اختر
            ما يعالجها فعلًا.
          </p>
          <div className="flex flex-col gap-2">
            {scenario.benefits.map((benefit) => (
              <OptionCard
                key={benefit.id}
                multi
                selected={benefits.includes(benefit.id)}
                onSelect={() => toggleBenefit(benefit.id)}
                title={benefit.label}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={finish} disabled={!benefits.length}>
              أكمل المسطرة
            </Button>
          </div>
        </div>
      ) : null}
    </ChatFrame>
  );
}
