"use client";

import { Siren } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useLabSession } from "../../api";
import {
  NOTIFY_WINDOW,
  crisisNotifyHour,
  crisisPostQuiz,
  crisisPreQuiz,
  deck,
  initialMeters,
  rounds,
  scoreCrisis,
  statementDoc,
  statementScore,
} from "../../content/crisis";
import { decided, feedSoFar, playRound, startCrisis, stakeholderLabels, type CrisisState, type Stakeholder } from "../../model/crisis-clock";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel, MeterBar, OptionCard } from "../bits";
import { BriefingCard } from "../briefing-card";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { Countdown } from "../workspace/countdown";
import { EventFeed } from "../workspace/event-feed";
import { RedlineEditor } from "../workspace/redline-editor";
import { SourcesPanel } from "../workspace/sources-panel";

type Stage = "brief" | "pre" | "room" | "statement" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, room: 1, statement: 2, post: 3, debrief: 3 };

function WarRoom({ state, onPlay }: { state: CrisisState; onPlay: (picks: string[]) => void }) {
  const [picks, setPicks] = useState<string[]>([]);
  const round = rounds[Math.min(state.round, rounds.length - 1)];
  const played = decided(state);
  const cards = round.cards.filter((id) => !played.has(id));
  const hour = state.done ? NOTIFY_WINDOW : round.hour;
  const notifyHour = crisisNotifyHour(state);
  const toggle = (id: string) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < round.picks ? [...p, id] : [...p.slice(1), id]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Siren className="size-5 text-pink" aria-hidden /> غرفة العمليات · {state.done ? "انتهت النافذة" : `${round.title} (ساعة ${round.hour})`}
          </span>
        }
        subtitle="الأحداث الجديدة في الأعلى. كل جولة تقرر فيها قبل أن يتقدم الوقت."
      >
        <EventFeed items={feedSoFar(rounds, state)} />
      </LabPanel>
      <aside className="flex min-w-0 flex-col gap-4">
        <Countdown value={NOTIFY_WINDOW - hour} total={NOTIFY_WINDOW} unit="ساعة" label={notifyHour !== null ? `أُبلغت سدايا في الساعة ${notifyHour}` : "متبقٍ من مهلة إشعار سدايا"} />
        <LabPanel title="أصحاب المصلحة">
          {(Object.keys(stakeholderLabels) as Stakeholder[]).map((key) => (
            <MeterBar key={key} label={stakeholderLabels[key]} value={state.meters[key]} />
          ))}
        </LabPanel>
        {state.done ? null : (
          <LabPanel title={`قرارك الآن (حتى ${round.picks === 1 ? "قرار واحد" : `${round.picks} قرارات`})`}>
            <div className="flex flex-col gap-2">
              {cards.map((id) => (
                <OptionCard key={id} multi={round.picks > 1} selected={picks.includes(id)} onSelect={() => toggle(id)} title={deck[id].label} detail={deck[id].detail} />
              ))}
            </div>
            <Button
              block
              disabled={picks.length === 0}
              onClick={() => {
                onPlay(picks);
                setPicks([]);
              }}
            >
              نفّذ وتقدّم بالوقت
            </Button>
          </LabPanel>
        )}
      </aside>
    </div>
  );
}

export function CrisisLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [crisis, setCrisis] = useState<CrisisState>(() => startCrisis(initialMeters));
  const [statement, setStatement] = useState<Record<string, string>>({});
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
    setCrisis(startCrisis(initialMeters));
    setStatement({});
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    const run = { state: crisis, statement };
    const { scorecard, crisisCommander } = scoreCrisis(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "crisis", run, pre, post, elapsed_seconds: clock.elapsedSeconds() },
      () => finishAttempt(lab.slug, scorecard, { crisisCommander }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const notifyHour = crisisNotifyHour(crisis);
  const hud =
    stage === "room" ? (
      <ObjectivesHud
        items={[
          { label: "الجولة", value: `${Math.min(crisis.round + 1, rounds.length)} / ${rounds.length}` },
          { label: "الاحتواء", value: decided(crisis).has("contain") ? "تم" : "لا", done: decided(crisis).has("contain") },
          { label: "إشعار سدايا", value: notifyHour !== null ? `ساعة ${notifyHour}` : "لم يُقدَّم", done: notifyHour !== null },
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
          <SourcesPanel slug="crisis-data-leak" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={crisisPreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("room");
          }}
        />
      ) : null}
      {stage === "room" ? (
        <>
          <WarRoom
            state={crisis}
            onPlay={(picks) => {
              void practice.simulateStep("room", { round: crisis.round, picks });
              setCrisis((s) => playRound(rounds, deck, s, picks));
            }}
          />
          {crisis.done ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={() => go("statement")}>
                اكتب البيان الصحفي
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      {stage === "statement" ? (
        <RedlineEditor
          doc={() => statementDoc()}
          fileName="بيان-صحفي-نقطة.pdf"
          gauge={(redlines) => (
            <LabPanel title="جودة البيان">
              <MeterBar label="دقة وشفافية" value={statementScore(redlines)} />
              <p className="m-0 text-[12px] leading-5 text-fg-muted">المسودة من فريق التسويق. كل بند يحتاج قرارك قبل النشر.</p>
            </LabPanel>
          )}
          cta="اعتمد البيان للنشر"
          onChange={(clauseId, optionId) => void practice.redline("statement", clauseId, optionId)}
          onDone={(redlines) => {
            setStatement(redlines);
            go("post");
          }}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={crisisPostQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("post", answers);
            void finish(r);
          }}
        />
      ) : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          <DocumentViewer doc={statementDoc()} fileName="بيان-صحفي-نقطة.pdf" redlines={statement} signed={statementScore(statement) >= 80} height="h-[min(70vh,760px)]" />
          <SourcesPanel slug="crisis-data-leak" />
        </>
      ) : null}
    </LabShell>
  );
}
