"use client";

import { Lightbulb, LockKeyhole, LockKeyholeOpen, SkipForward } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useLabSession } from "../../api";
import { escapePostQuiz, escapePreQuiz, findingsMemo, locks, recommendations, scoreEscape, TARGET } from "../../content/escape";
import { HINT_COST, ROOM_MINUTES, WRONG_COST, hintsShown, roomSummary, skipLock, startRoom, takeHint, tryCode, type RoomState } from "../../model/escape-locks";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel, OptionCard } from "../bits";
import { BriefingCard } from "../briefing-card";
import { DataTable } from "../workspace/data-table";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { Countdown } from "../workspace/countdown";
import { SourcesPanel } from "../workspace/sources-panel";

type Stage = "brief" | "pre" | "room" | "memo" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, room: 1, memo: 2, post: 3, debrief: 3 };

function Room({ state, onChange, onLog }: { state: RoomState; onChange: (next: RoomState) => void; onLog: (action: Record<string, unknown>) => void }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"wrong" | null>(null);
  const lock = locks[Math.min(state.index, locks.length - 1)];
  const summary = roomSummary(locks, state);
  const hints = hintsShown(locks, state, lock.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <LockKeyhole className="size-5 text-purple" aria-hidden /> {lock.title}
          </span>
        }
        subtitle={lock.story}
      >
        {lock.evidence.map((evidence) => (
          <div key={evidence.title} className="flex flex-col gap-1.5">
            <h3 className="m-0 text-[13px] font-bold">{evidence.title}</h3>
            <DataTable head={evidence.head} rows={evidence.rows} />
            {evidence.note ? <p className="m-0 text-[12px] leading-5 text-fg-muted">{evidence.note}</p> : null}
          </div>
        ))}
        <form
          className="flex flex-col gap-2 rounded-photo border border-line bg-surface-alt/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const { state: next, correct } = tryCode(locks, state, input);
            onLog({ lock: lock.id, code: input, correct });
            setFeedback(correct ? null : "wrong");
            setInput("");
            onChange(next);
          }}
        >
          <label htmlFor="lock-code" className="text-sm font-semibold">
            {lock.question}
          </label>
          <div className="flex gap-2">
            <input
              id="lock-code"
              className={cn("ma-input flex-1 text-end text-lg tracking-widest", feedback === "wrong" && "border-pink")}
              dir="ltr"
              inputMode="numeric"
              autoComplete="off"
              placeholder={lock.unit}
              value={input}
              onChange={(e) => {
                setFeedback(null);
                setInput(e.target.value);
              }}
            />
            <Button type="submit" disabled={!input.trim()}>
              افتح
            </Button>
          </div>
          {feedback === "wrong" ? <p className="m-0 text-[13px] font-semibold text-pink">الرمز لم يفتح القفل (−{WRONG_COST} دقيقة).</p> : null}
        </form>
      </LabPanel>
      <aside className="flex min-w-0 flex-col gap-4">
        <Countdown value={summary.left} total={ROOM_MINUTES} unit="دقيقة" label="الوقت قبل اجتماع لجنة الاستحواذ" />
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="الأقفال">
          {locks.map((l, index) => {
            const p = state.progress[l.id];
            return (
              <li
                key={l.id}
                className={cn(
                  "flex items-center gap-2 rounded-photo border px-3 py-2 text-[13px]",
                  p?.solved ? "border-green bg-green/10" : p?.skipped ? "border-line text-fg-muted line-through" : index === state.index ? "border-accent" : "border-line text-fg-muted",
                )}
              >
                {p?.solved ? <LockKeyholeOpen className="size-4 text-green" aria-hidden /> : <LockKeyhole className="size-4" aria-hidden />}
                {l.title}
              </li>
            );
          })}
        </ol>
        <LabPanel title="مساعدة">
          {hints.map((hint) => (
            <p key={hint} className="m-0 inline-flex items-start gap-2 rounded-photo bg-yellow/15 px-3 py-2 text-[13px] leading-6">
              <Lightbulb className="mt-1 size-4 shrink-0 text-yellow" aria-hidden /> {hint}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={hints.length >= lock.hints.length}
              onClick={() => {
                onLog({ lock: lock.id, hint: true });
                onChange(takeHint(locks, state));
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="size-3.5" aria-hidden /> تلميح (−{HINT_COST} دقائق)
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onLog({ lock: lock.id, skip: true });
                setFeedback(null);
                onChange(skipLock(locks, state));
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <SkipForward className="size-3.5" aria-hidden /> تجاوز القفل
              </span>
            </Button>
          </div>
        </LabPanel>
      </aside>
    </div>
  );
}

export function EscapeLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [room, setRoom] = useState<RoomState>(startRoom);
  const [recommendation, setRecommendation] = useState("");
  const [result, setResult] = useState<LabResult | null>(null);
  const clock = usePracticeClock();
  const practice = useLabSession(lab.slug);

  const go = (next: Stage) => {
    void practice.enterPhase(next);
    setStage(next);
  };

  const restart = () => {
    void practice.reset();
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setRoom(startRoom());
    setRecommendation("");
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    const run = { state: room, recommendation };
    const { scorecard, escapeArtist } = scoreEscape(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "escape", run, pre, post, elapsed_seconds: clock.elapsedSeconds(), client_result: { scorecard, signals: { escapeArtist } } },
      () => finishAttempt(lab.slug, scorecard, { escapeArtist }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const summary = roomSummary(locks, room);
  const hud =
    stage === "room" ? (
      <ObjectivesHud
        items={[
          { label: "الأقفال", value: `${summary.solved} / ${locks.length}`, done: summary.solved === locks.length },
          { label: "الوقت", value: `${summary.left} د`, done: summary.left > 0 },
          { label: "التلميحات", value: summary.hints },
        ]}
      />
    ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? (
        <>
          <BriefingCard
            lab={lab}
            onStart={() => {
              void practice.start();
              go("pre");
            }}
          />
          <SourcesPanel slug="audit-escape-room" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={escapePreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("room");
          }}
        />
      ) : null}
      {stage === "room" ? (
        room.over ? (
          <LabPanel title={summary.solved === locks.length ? "فُتحت كل الأقفال" : "انتهت الغرفة"} subtitle={`فتحت ${summary.solved} من ${locks.length} أقفال، وبقي ${summary.left} دقيقة.`}>
            <div className="flex justify-end">
              <Button size="lg" onClick={() => go("memo")}>
                اكتب التوصية
              </Button>
            </div>
          </LabPanel>
        ) : (
          <Room state={room} onChange={setRoom} onLog={(action) => void practice.simulateStep("room", action)} />
        )
      ) : null}
      {stage === "memo" ? (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <DocumentViewer doc={findingsMemo(room, recommendation)} fileName="مذكرة-الفحص-الواحة.pdf" height="h-[min(70vh,720px)]" />
          <LabPanel title={`توصيتك بشأن الاستحواذ على «${TARGET}»`} subtitle="لجنة الاستحواذ تجتمع الآن. توصيتك تدخل المذكرة.">
            <div role="radiogroup" aria-label="التوصية" className="flex flex-col gap-2">
              {recommendations.map((r) => (
                <OptionCard key={r.id} selected={recommendation === r.id} onSelect={() => setRecommendation(r.id)} title={r.label} detail={r.detail} />
              ))}
            </div>
            <Button
              size="lg"
              block
              disabled={!recommendation}
              onClick={() => {
                void practice.submitForm("memo", { recommendation });
                go("post");
              }}
            >
              أرسل المذكرة
            </Button>
          </LabPanel>
        </div>
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={escapePostQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("post", answers);
            void finish(r);
          }}
        />
      ) : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          <DocumentViewer doc={findingsMemo(room, recommendation)} fileName="مذكرة-الفحص-الواحة.pdf" signed={summary.solved >= 4} height="h-[min(70vh,760px)]" />
          <SourcesPanel slug="audit-escape-room" />
        </>
      ) : null}
    </LabShell>
  );
}
