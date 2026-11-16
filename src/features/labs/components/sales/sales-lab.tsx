"use client";

import { useState } from "react";

import { salesCall, salesFacts, salesPostQuiz, salesPreQuiz, scoreSales, type CrmEntry } from "../../content/sales";
import { choose, learnerTalkShare, startDialogue, type DialogueState } from "../../model/dialogue";
import { useLabSession } from "../../api";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { CrmLogForm, EmailComposer, PrepPanel } from "./crm-panel";

type Stage = "brief" | "pre" | "prep" | "call" | "crm" | "email" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, prep: 1, call: 2, crm: 3, email: 4, post: 5, debrief: 5 };

export function SalesLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [hyp, setHyp] = useState<string[]>([]);
  const [call, setCall] = useState<DialogueState>(() => startDialogue(salesCall));
  const [crm, setCrm] = useState<CrmEntry | null>(null);
  const [email, setEmail] = useState<string[]>([]);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();
  const practice = useLabSession(lab.slug);

  const restart = () => {
    void practice.reset();
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setHyp([]);
    setCall(startDialogue(salesCall));
    setCrm(null);
    setEmail([]);
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    if (!crm) return;
    const { scorecard, dealClosed } = scoreSales({ call, hypotheses: hyp, crm, email });
    const result = await practice.complete(
      {
        engine: "legacy",
        scorer: "sales",
        run: { call, hypotheses: hyp, crm, email },
        pre,
        post,
        elapsed_seconds: clock.elapsedSeconds(),
      },
      () => finishAttempt(lab.slug, scorecard, { dealClosed }, pre, post, clock.elapsedSeconds()),
    );
    setResult(result);
    setStage("debrief");
  };

  const hud =
    stage === "call" ? (
      <ObjectivesHud
        items={[
          { label: "معلومات مكتشفة", value: `${call.facts.length} / 5`, done: call.facts.length === 5 },
          { label: "أسئلة مفتوحة", value: call.tags["open-question"] ?? 0, done: (call.tags["open-question"] ?? 0) >= 3 },
          { label: "نسبة حديثك", value: `${learnerTalkShare(call)}٪`, done: learnerTalkShare(call) <= 55 },
          { label: "الهدف", value: "اجتماع مع صاحب القرار" },
        ]}
      />
    ) : null;

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
          questions={salesPreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            void practice.enterPhase("prep");
            setStage("prep");
          }}
        />
      ) : null}
      {stage === "prep" ? (
        <PrepPanel
          onDone={(picked) => {
            setHyp(picked);
            void practice.submitForm("prep", { hypotheses: picked });
            void practice.enterPhase("call");
            setStage("call");
          }}
        />
      ) : null}
      {stage === "call" ? (
        <PersonaChat
          graph={salesCall}
          state={call}
          onChoose={(id) => {
            void practice.choose("sales-call", call.nodeId, id);
            setCall((s) => choose(salesCall, s, id));
          }}
          onContinue={() => {
            void practice.enterPhase("crm");
            setStage("crm");
          }}
          continueLabel="سجّل المكالمة في الـCRM"
          factLabels={salesFacts}
          showTalkRatio
        />
      ) : null}
      {stage === "crm" ? (
        <CrmLogForm
          onDone={(entry) => {
            setCrm(entry);
            void practice.updateCrm("crm", { ...entry });
            void practice.enterPhase("email");
            setStage("email");
          }}
        />
      ) : null}
      {stage === "email" ? (
        <EmailComposer
          onDone={(blocks) => {
            setEmail(blocks);
            void practice.submitForm("email", { blocks });
            void practice.enterPhase("post");
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={salesPostQuiz}
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
