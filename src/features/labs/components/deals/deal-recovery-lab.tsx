"use client";

import { ClipboardList } from "lucide-react";
import { useState } from "react";

import { scoreDealRecovery } from "../../content/deals/score";
import type { DealCrmEntry, DealScenario } from "../../content/deals/types";
import { choose, learnerTalkShare, startDialogue, type DialogueState } from "../../model/dialogue";
import { useLabSession } from "../../api";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel } from "../bits";
import { BriefingCard } from "../briefing-card";
import { pipelineStages } from "../crm/crm-types";
import { DealDrawer } from "../crm/deal-drawer";
import { DealUpdateForm } from "../crm/deal-update-form";
import { PipelineBoard } from "../crm/pipeline-board";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { DealGauge, RedlineStep } from "./redline-step";
import { RootCausePicker } from "./root-cause-picker";

type Stage = "brief" | "pre" | "diagnose" | "call" | "redline" | "crm" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, diagnose: 1, call: 2, redline: 3, crm: 4, post: 5, debrief: 5 };

/** The shared deal-recovery runner: CRM diagnosis → recovery call → contract redline → CRM update. */
export function DealRecoveryLab({ lab, scenario }: { lab: LabDefinition; scenario: DealScenario }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [opened, setOpened] = useState(false);
  const [causes, setCauses] = useState<string[]>([]);
  const [call, setCall] = useState<DialogueState>(() => startDialogue(scenario.graph));
  const [redlines, setRedlines] = useState<Record<string, string>>({});
  const [crm, setCrm] = useState<DealCrmEntry | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();
  const practice = useLabSession(lab.slug);

  const restart = () => {
    void practice.reset();
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setOpened(false);
    setCauses([]);
    setCall(startDialogue(scenario.graph));
    setRedlines({});
    setCrm(null);
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    if (!crm) return;
    const run = { causes, call, redlines, crm };
    const { scorecard, dealSaved, fairTerms } = scoreDealRecovery(scenario, run);
    const result = await practice.complete(
      { engine: "legacy", scorer: "deals", run, pre, post, elapsed_seconds: clock.elapsedSeconds(), client_result: { scorecard, signals: { dealSaved, fairTerms } } },
      () => finishAttempt(lab.slug, scorecard, { dealSaved, fairTerms }, pre, post, clock.elapsedSeconds()),
    );
    setResult(result);
    setStage("debrief");
  };

  const factCount = Object.keys(scenario.facts).length;
  const hud =
    stage === "call" ? (
      <ObjectivesHud
        items={[
          { label: "معلومات مكتشفة", value: `${call.facts.length} / ${factCount}`, done: call.facts.length === factCount },
          { label: "التوتر", value: `${call.meters.tension}٪`, done: call.meters.tension <= 40 },
          { label: "نسبة حديثك", value: `${learnerTalkShare(call)}٪`, done: learnerTalkShare(call) <= 55 },
          { label: "الهدف", value: "إعادة الصفقة للطاولة" },
        ]}
      />
    ) : null;

  const pickedCauses = scenario.rootCauses.filter((c) => causes.includes(c.id));

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? (
        <BriefingCard
          lab={lab}
          onStart={() => {
            void practice.start();
            void practice.enterPhase("pre");
            setStage("pre");
          }}
        />
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={scenario.preQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            void practice.enterPhase("diagnose");
            setStage("diagnose");
          }}
        />
      ) : null}
      {stage === "diagnose" ? (
        <>
          <LabPanel title="مسار الصفقات" subtitle={`لوحة فريق المبيعات في «${scenario.seller}». صفقتك في عمود «متعثرة»؛ افتح ملفها.`}>
            <PipelineBoard stages={pipelineStages} deals={[...scenario.pipeline, scenario.deal]} focusId={scenario.deal.id} onOpen={() => setOpened(true)} />
          </LabPanel>
          {opened ? (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <DealDrawer deal={scenario.deal} probability={scenario.probability} contact={scenario.contact} timeline={scenario.timeline} />
              <RootCausePicker
                causes={scenario.rootCauses}
                onDone={(ids) => {
                  setCauses(ids);
                  void practice.submitForm("diagnose", { causes: ids });
                  void practice.enterPhase("call");
                  setStage("call");
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
      {stage === "call" ? (
        <PersonaChat
          graph={scenario.graph}
          state={call}
          onChoose={(id) => {
            void practice.choose(scenario.graph.id, call.nodeId, id);
            setCall((s) => choose(scenario.graph, s, id));
          }}
          onContinue={() => {
            void practice.enterPhase("redline");
            setStage("redline");
          }}
          continueLabel="عدّل العقد"
          factLabels={scenario.facts}
          showTalkRatio
          aside={
            <LabPanel
              title={
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="size-5 text-pink" aria-hidden /> تشخيصك قبل المكالمة
                </span>
              }
            >
              <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6">
                {pickedCauses.map((c) => (
                  <li key={c.id}>{c.label}</li>
                ))}
              </ul>
            </LabPanel>
          }
        />
      ) : null}
      {stage === "redline" ? (
        <RedlineStep
          scenario={scenario}
          onDone={(r) => {
            setRedlines(r);
            void practice.submitForm("redline", { redlines: r });
            void practice.enterPhase("crm");
            setStage("crm");
          }}
        />
      ) : null}
      {stage === "crm" ? (
        <DealUpdateForm
          nextSteps={scenario.nextSteps}
          summary={<DealGauge scenario={scenario} redlines={redlines} />}
          onDone={(entry) => {
            setCrm(entry);
            void practice.updateCrm("crm", { ...entry });
            void practice.enterPhase("post");
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={scenario.postQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("post", answers);
            void finish(r);
          }}
        />
      ) : null}
      {stage === "debrief" && result ? <LabScorecard lab={lab} result={result} onRetry={restart} /> : null}
    </LabShell>
  );
}
