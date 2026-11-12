"use client";

import { useState } from "react";

import { salesFailureScenario } from "../../content/sales-failure/scenario";
import { scoreSalesFailure } from "../../content/sales-failure/score";
import type { CauseId, CauseStatus, FollowUpSlot, FunnelAnswer, WeekPlan } from "../../content/sales-failure/types";
import { choose, learnerTalkShare, startDialogue, type DialogueState } from "../../model/dialogue";
import { finishAttempt } from "../../model/progress-store";
import { clock } from "../../model/scoring";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { CausesChecklist } from "./causes-checklist";
import { FollowUpPlanner } from "./follow-up-planner";
import { FunnelCalculator } from "./funnel-calculator";
import { QuestionBank } from "./question-bank";
import { WeekPlanner } from "./week-planner";

type Stage = "brief" | "pre" | "plan" | "funnel" | "questions" | "call" | "followup" | "post" | "debrief";
const stepOf: Record<Stage, number> = {
  brief: 0,
  pre: 0,
  plan: 1,
  funnel: 2,
  questions: 3,
  call: 4,
  followup: 5,
  post: 6,
  debrief: 6,
};

const emptyPlan: WeekPlan = { sun: [], mon: [], tue: [], wed: [], thu: [] };

/** The sales-failure week: plan → funnel → questions → GPS cold call → follow-up → 10-cause debrief. */
export function SalesFailureLab({ lab }: { lab: LabDefinition }) {
  const scenario = salesFailureScenario;
  const practice = usePracticeClock();
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [plan, setPlan] = useState<WeekPlan>(emptyPlan);
  const [funnel, setFunnel] = useState<FunnelAnswer>({ prospects: 0, calls: 0, meetings: 0, proposals: 0 });
  const [questions, setQuestions] = useState<string[]>([]);
  const [call, setCall] = useState<DialogueState>(() => startDialogue(scenario.graph));
  const [followUp, setFollowUp] = useState<Record<FollowUpSlot, string | null>>({ 1: null, 2: null, 3: null });
  const [result, setResult] = useState<LabResult | null>(null);
  const [causes, setCauses] = useState<Record<CauseId, CauseStatus> | null>(null);

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    setPre(null);
    setPlan(emptyPlan);
    setFunnel({ prospects: 0, calls: 0, meetings: 0, proposals: 0 });
    setQuestions([]);
    setCall(startDialogue(scenario.graph));
    setFollowUp({ 1: null, 2: null, 3: null });
    setResult(null);
    setCauses(null);
    practice.reset();
  };

  const finish = (post: QuizResult) => {
    const tags = Object.entries(call.tags).flatMap(([tag, count]) => Array.from({ length: count }, () => tag));
    const notes = call.transcript
      .filter((entry) => entry.note)
      .map((entry) => ({ at: clock(entry.at), tone: entry.note!.tone, text: entry.note!.text }));
    const scored = scoreSalesFailure(scenario, {
      plan,
      funnel,
      questions,
      call: { outcome: call.outcome, tags, notes },
      followUp,
      postPercent: post.percent,
    });
    setCauses(scored.causes);
    setResult(
      finishAttempt(
        lab.slug,
        scored.scorecard,
        { rejectionProof: scored.rejectionProof, funnelMaster: scored.funnelMaster },
        pre,
        post,
        practice.elapsedSeconds(),
      ),
    );
    setStage("debrief");
  };

  const share = learnerTalkShare(call);
  const factCount = Object.keys(scenario.facts).length;
  const hud =
    stage === "call" ? (
      <ObjectivesHud
        items={[
          { label: "معلومات مكتشفة", value: `${call.facts.length} / ${factCount}`, done: call.facts.length === factCount },
          { label: "الثقة", value: `${call.meters.trust}٪`, done: call.meters.trust >= 60 },
          { label: "الصبر", value: `${call.meters.patience}٪`, done: call.meters.patience >= 30 },
          { label: "نسبة حديثك", value: `${share}٪`, done: share <= 55 },
        ]}
      />
    ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? (
        <BriefingCard
          lab={lab}
          onStart={() => {
            practice.reset();
            setStage("pre");
          }}
        />
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={scenario.preQuiz}
          onDone={(value) => {
            setPre(value);
            setStage("plan");
          }}
        />
      ) : null}
      {stage === "plan" ? (
        <WeekPlanner
          scenario={scenario}
          onDone={(value) => {
            setPlan(value);
            setStage("funnel");
          }}
        />
      ) : null}
      {stage === "funnel" ? (
        <FunnelCalculator
          scenario={scenario}
          onDone={(value) => {
            setFunnel(value);
            setStage("questions");
          }}
        />
      ) : null}
      {stage === "questions" ? (
        <QuestionBank
          scenario={scenario}
          onDone={(value) => {
            setQuestions(value);
            setStage("call");
          }}
        />
      ) : null}
      {stage === "call" ? (
        <PersonaChat
          graph={scenario.graph}
          state={call}
          onChoose={(id) => setCall((current) => choose(scenario.graph, current, id))}
          onContinue={() => setStage("followup")}
          continueLabel="خطّط المتابعة"
          factLabels={scenario.facts}
          showTalkRatio
        />
      ) : null}
      {stage === "followup" ? (
        <FollowUpPlanner
          scenario={scenario}
          onDone={(value) => {
            setFollowUp(value);
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={scenario.postQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? (
        <div className="flex flex-col gap-6">
          {causes ? <CausesChecklist causes={scenario.causes} statuses={causes} /> : null}
          <LabScorecard lab={lab} result={result} onRetry={restart} />
        </div>
      ) : null}
    </LabShell>
  );
}
