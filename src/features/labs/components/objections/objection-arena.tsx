"use client";

import { Ban, CircleHelp, EyeOff, Search, TriangleAlert, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { Persona } from "../../model/dialogue";
import { clock } from "../../model/scoring";
import {
  objectionKinds,
  type ObjectionKind,
  type ObjectionRound,
  type RoundResult,
} from "../../content/objections/types";
import { LabPanel, MeterBar, OptionCard, Pill } from "../bits";
import { ChatChoice, ChatFrame, type ChatEntry } from "../chat-frame";

const kindIcons: Record<ObjectionKind, typeof CircleHelp> = {
  misunderstanding: CircleHelp,
  doubt: Search,
  "real-defect": TriangleAlert,
  "no-need": Ban,
  competitor: Trophy,
  false: EyeOff,
};

const kindOrder = Object.keys(objectionKinds) as ObjectionKind[];

type Step = "classify" | "bridge" | "reply";

/**
 * One objection round as a two-person chat: the customer speaks, the learner classifies and
 * answers, and the customer reacts. Previous rounds stay in the transcript above.
 */
export function ObjectionArena({
  round,
  persona,
  index,
  total,
  trust,
  tension,
  history,
  onDone,
}: {
  round: ObjectionRound;
  persona: Persona;
  index: number;
  total: number;
  trust: number;
  tension: number;
  history: readonly ChatEntry[];
  onDone: (result: RoundResult, entries: ChatEntry[]) => void;
}) {
  const [step, setStep] = useState<Step>("classify");
  const [kind, setKind] = useState<ObjectionKind | null>(null);
  const [bridgeId, setBridgeId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const startSeconds = (() => {
    const last = history.at(-1)?.at;
    if (!last) return 0;
    const [minutes, seconds] = last.split(":").map(Number);
    return minutes * 60 + seconds + 14;
  })();
  const [entries, setEntries] = useState<ChatEntry[]>(() => [
    { id: `${round.id}-open`, who: "persona", text: round.opening, at: clock(startSeconds) },
  ]);
  const [typing, setTyping] = useState(false);
  const seconds = useRef(startSeconds);
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

  const bridge = round.bridges.find((option) => option.id === bridgeId) ?? null;
  const reply = round.replies.find((option) => option.id === replyId) ?? null;
  const kindCorrect = kind === round.kind;

  const classify = (value: ObjectionKind) => {
    setKind(value);
    const correct = value === round.kind;
    setEntries((current) => [
      ...current.filter((entry) => entry.id !== `${round.id}-coach`),
      {
        id: `${round.id}-coach`,
        who: "coach",
        text: `صنّفت الاعتراض: ${objectionKinds[value].label}${correct ? " ✓" : " — راجع النوع"}`,
        tone: correct ? "good" : "bad",
        at: nextAt(),
      },
    ]);
  };

  const chooseBridge = (value: string) => {
    setBridgeId(value);
    const option = round.bridges.find((entry) => entry.id === value);
    setEntries((current) => [
      ...current.filter((entry) => entry.id !== `${round.id}-bridge` && entry.id !== `${round.id}-reveal`),
      { id: `${round.id}-bridge`, who: "learner", text: option?.label ?? "", at: nextAt() },
    ]);
    setTyping(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEntries((current) => [
        ...current.filter((entry) => entry.id !== `${round.id}-reveal`),
        { id: `${round.id}-reveal`, who: "persona", text: round.reveal, at: nextAt() },
      ]);
      setTyping(false);
    }, 650);
  };

  const chooseReply = (value: string) => {
    setReplyId(value);
    const option = round.replies.find((entry) => entry.id === value);
    setEntries((current) => [
      ...current.filter((entry) => entry.id !== `${round.id}-reply` && entry.id !== `${round.id}-reaction`),
      { id: `${round.id}-reply`, who: "learner", text: option?.label ?? "", at: nextAt() },
    ]);
    setTyping(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEntries((current) => [
        ...current.filter((entry) => entry.id !== `${round.id}-reaction`),
        { id: `${round.id}-reaction`, who: "persona", text: option?.reaction ?? "", at: nextAt() },
      ]);
      setTyping(false);
    }, 650);
  };

  const finish = () => {
    if (!reply) return;
    onDone(
      {
        roundId: round.id,
        kind,
        bridgeId,
        replyId,
        trust: Math.max(0, Math.min(100, trust + reply.trust)),
        tension: Math.max(0, Math.min(100, tension + reply.tension)),
        tags: reply.tags,
      },
      entries,
    );
  };

  return (
    <ChatFrame
      title={`مكالمة مع ${persona.name}`}
      subtitle={`الجولة ${index + 1} من ${total} · اختر ردّك من الخيارات. كل رد يغيّر مزاج الطرف الآخر ومسار الحوار.`}
      persona={persona}
      entries={[...history, ...entries]}
      typing={typing}
      aside={
        <>
          <LabPanel title="المؤشرات الحية">
            <MeterBar label="الثقة" value={trust} />
            <MeterBar label="التوتر" value={tension} invert />
            <p className="m-0 text-[12px] leading-5 text-fg-muted">
              كل رد يغيّر المؤشرين. الهدف: ثقة أعلى وتوتر أقل، لا مجرد «كلام صحيح».
            </p>
          </LabPanel>
          <LabPanel title="بنك الاعتراضات" subtitle="الأنواع الستة التي ستراها في الميدان">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {kindOrder.map((key) => {
                const Icon = kindIcons[key];
                const active = key === round.kind && step !== "classify";
                return (
                  <li
                    key={key}
                    className={cn(
                      "flex items-start gap-2 rounded-photo border px-3 py-2 text-[13px] leading-5",
                      active ? "border-accent bg-accent/10" : "border-line",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", active ? "text-accent" : "text-fg-muted")} aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold">{objectionKinds[key].label}</span>
                      <span className="text-fg-muted">{objectionKinds[key].text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </LabPanel>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{round.signal}</Pill>
          <Pill>
            {step === "classify" ? "1 · صنّف" : step === "bridge" ? "2 · الجسر" : "3 · ردّك"}
          </Pill>
        </div>

        {step === "classify" ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm font-bold">ما نوع هذا الاعتراض؟</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {kindOrder.map((key) => {
                const Icon = kindIcons[key];
                return (
                  <OptionCard
                    key={key}
                    selected={kind === key}
                    onSelect={() => classify(key)}
                    title={
                      <span className="inline-flex items-center gap-2">
                        <Icon className="size-4 text-fg-muted" aria-hidden /> {objectionKinds[key].label}
                      </span>
                    }
                    detail={objectionKinds[key].text}
                  />
                );
              })}
            </div>
            {kind ? (
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-photo p-3 text-sm leading-7",
                  kindCorrect ? "bg-green/15" : "bg-pink/15",
                )}
              >
                <span className="font-bold">{kindCorrect ? "تصنيف صحيح." : `ليس ${objectionKinds[kind].label}.`}</span>
                <span>{objectionKinds[round.kind].text}</span>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setStep("bridge")}>
                    التالي: اختر الجسر
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "bridge" ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm font-bold">ما الجسر المناسب لهذا النوع؟</p>
            <div className="flex flex-col gap-2">
              {round.bridges.map((option) => (
                <ChatChoice
                  key={option.id}
                  selected={bridgeId === option.id}
                  onSelect={() => chooseBridge(option.id)}
                  disabled={typing}
                >
                  {option.label}
                </ChatChoice>
              ))}
            </div>
            {bridge ? (
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-photo p-3 text-sm leading-7",
                  bridge.correct ? "bg-green/15" : "bg-pink/15",
                )}
              >
                <span className="font-bold">{bridge.correct ? "جسر صحيح." : "هذا ليس الجسر الأنسب."}</span>
                <span>{bridge.why}</span>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setStep("reply")}>
                    التالي: اختر ردّك
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "reply" ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm font-bold">ماذا تقول الآن؟</p>
            <div className="flex flex-col gap-2">
              {round.replies.map((option) => (
                <ChatChoice
                  key={option.id}
                  selected={replyId === option.id}
                  onSelect={() => chooseReply(option.id)}
                  disabled={typing}
                >
                  {option.label}
                </ChatChoice>
              ))}
            </div>
            {reply ? (
              <div className="flex flex-col gap-2 rounded-photo border border-line bg-surface-alt/40 p-3 text-sm leading-7">
                <span className="font-bold">ردّ العميل:</span>
                <span>{reply.reaction}</span>
                {reply.note ? <span className="text-[13px] text-fg-muted">{reply.note.text}</span> : null}
                <div className="flex justify-end">
                  <Button size="sm" onClick={finish}>
                    {index + 1 === total ? "أنهِ الجولات" : "الجولة التالية"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ChatFrame>
  );
}
