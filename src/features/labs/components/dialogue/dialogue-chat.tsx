"use client";

import { Lightbulb, MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { brandBg, type BrandColor } from "@/components/ui/brand-colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import {
  learnerShare,
  type DialoguePlayer,
  type FactSpec,
  type MeterSpec,
  type PersonaTone,
  type ResolvedSpeaker,
  type RuntimeState,
} from "../../model/dialogue-runtime";
import { clock } from "../../model/scoring";
import { LabPanel, MeterBar } from "../bits";

const toneColor = (tone: PersonaTone): BrandColor => (tone === "blue" ? "sky" : tone);

function typingDelay(text: string): number {
  return 600 + Math.min(600, text.length * 6);
}

function Avatar({ speaker }: { speaker: ResolvedSpeaker }) {
  if (speaker.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded avatar on the labs CDN
    return <img src={speaker.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink", brandBg[toneColor(speaker.tone)])}>
      {speaker.initials}
    </span>
  );
}

/**
 * The conversation surface of the generic dialogue runtime: like `PersonaChat`, but meters,
 * speakers and facts come from the admin engine and scenario instead of code.
 */
export function DialogueChat({
  title,
  player,
  state,
  speakers,
  meters,
  visibleMeters,
  facts,
  showMeters = true,
  showFacts = true,
  showTalkRatio = false,
  onChoose,
  onContinue,
  continueLabel = "متابعة",
  aside,
}: {
  title: string;
  player: DialoguePlayer;
  state: RuntimeState;
  speakers: Record<string, ResolvedSpeaker>;
  meters: MeterSpec[];
  visibleMeters?: string[] | null;
  facts: FactSpec[];
  showMeters?: boolean;
  showFacts?: boolean;
  showTalkRatio?: boolean;
  onChoose: (choiceId: string, nodeId: string) => void;
  onContinue: () => void;
  continueLabel?: string;
  aside?: ReactNode;
}) {
  const [revealed, setRevealed] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const total = state.transcript.length;
  const pending = state.transcript[revealed];
  const typing = revealed < total && pending?.who !== "learner";
  const settled = revealed >= total;
  const choices = settled ? player.available(state) : [];

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), pending.who === "learner" ? 150 : typingDelay(pending.text));
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [revealed, typing]);

  const typingSpeaker = typing && pending ? speakers[pending.who] : null;
  const share = learnerShare(state);
  const shown = meters.filter((meter) => (visibleMeters ? visibleMeters.includes(meter.key) : meter.visible !== false));
  const factLabels = Object.fromEntries(facts.map((fact) => [fact.id, fact.label]));
  const missing = facts.length - state.facts.filter((fact) => fact in factLabels).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <LabPanel title={title} subtitle="اختر ردّك من الخيارات. كل رد يغيّر مزاج الطرف الآخر ومسار الحوار.">
        <ol
          ref={listRef}
          aria-live="polite"
          className="m-0 flex h-[min(52vh,520px)] list-none flex-col gap-3 overflow-y-auto rounded-photo border border-line bg-surface-alt/30 p-3 md:p-4"
        >
          {state.transcript.slice(0, revealed).map((entry) => {
            const learner = entry.who === "learner";
            const speaker = learner ? null : speakers[entry.who];
            return (
              <li key={entry.id} className={cn("flex items-end gap-2", learner ? "flex-row-reverse" : "flex-row")}>
                {speaker ? <Avatar speaker={speaker} /> : null}
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-1 rounded-panel px-4 py-2.5 text-sm leading-7",
                    learner ? "rounded-ee-sm bg-accent text-on-accent" : "rounded-es-sm border border-line bg-surface",
                  )}
                >
                  <span className={cn("text-[11px] font-semibold", learner ? "opacity-80" : "text-fg-muted")}>
                    {learner ? "أنت" : speaker?.name ?? entry.who} · {clock(entry.at)}
                  </span>
                  <span>{entry.text}</span>
                </div>
              </li>
            );
          })}
          {typingSpeaker ? (
            <li className="flex items-center gap-2 text-[13px] text-fg-muted" aria-label={`${typingSpeaker.name} يكتب`}>
              <Avatar speaker={typingSpeaker} />
              <span className="inline-flex gap-1 rounded-full border border-line bg-surface px-3 py-2">
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted" />
              </span>
            </li>
          ) : null}
        </ol>

        {settled && state.outcome ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-photo p-4 text-ink",
              state.outcome === "success" ? "bg-green" : state.outcome === "fail" ? "bg-pink" : "bg-yellow",
            )}
          >
            <p className="m-0 font-bold">
              {state.outcome === "success" ? "انتهت الجلسة بنجاح." : state.outcome === "fail" ? "انتهت الجلسة قبل الأوان." : "انتهت الجلسة دون التزام واضح."}
            </p>
            <Button variant="on-color" onClick={onContinue}>
              {continueLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2" role="group" aria-label="ردودك المتاحة">
            <p className="m-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-muted">
              <MessageSquareText className="size-4" aria-hidden /> ردّك
            </p>
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose(choice.id, state.nodeId)}
                className="rounded-photo border border-line bg-surface p-3 text-start text-sm leading-7 transition-colors hover:border-accent hover:bg-accent/5"
              >
                {choice.label}
              </button>
            ))}
            {!settled ? <p className="m-0 text-[13px] text-fg-muted">انتظر الرد…</p> : null}
            {settled && !choices.length && !state.outcome ? (
              <p className="m-0 text-[13px] text-fg-muted">لا توجد ردود متاحة هنا. راجع السيناريو في لوحة الإدارة.</p>
            ) : null}
          </div>
        )}
      </LabPanel>

      <aside className="flex min-w-0 flex-col gap-4">
        {showMeters && (shown.length || showTalkRatio) ? (
          <LabPanel title="المؤشرات الحية">
            {shown.map((meter) => (
              <MeterBar key={meter.key} label={meter.label.ar} value={state.meters[meter.key] ?? 0} invert={meter.key === "tension"} />
            ))}
            {showTalkRatio ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px] text-fg-muted">
                  <span>نسبة حديثك</span>
                  <span className={cn("font-semibold tabular-nums", share > 60 ? "text-pink" : "text-fg")}>{share}٪</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent" style={{ width: `${share}%` }} />
                </div>
              </div>
            ) : null}
          </LabPanel>
        ) : null}
        {showFacts && facts.length ? (
          <LabPanel title="ما اكتشفته" subtitle="معلومات جوهرية ظهرت في الحوار">
            {state.facts.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {state.facts.map((fact) => (
                  <li key={fact} className="flex items-start gap-2 text-sm leading-6">
                    <Lightbulb className="mt-1 size-4 shrink-0 text-yellow" aria-hidden />
                    {factLabels[fact] ?? fact}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-fg-muted">لا شيء بعد. الأسئلة المفتوحة تكشف أكثر.</p>
            )}
            <p className="m-0 text-[12px] text-fg-muted">
              {missing ? `${missing} معلومات أخرى لم تُكتشف بعد` : "اكتشفت كل المعلومات الجوهرية."}
            </p>
          </LabPanel>
        ) : null}
        {aside}
      </aside>
    </div>
  );
}
