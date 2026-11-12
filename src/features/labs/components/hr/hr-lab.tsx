"use client";

import { useState } from "react";

import { hrFacts, hrPostQuiz, hrPreQuiz, jointSession, khaledSession, saraSession, scoreHr } from "../../content/hr";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { CaseFile, PolicyCard, ResolutionBuilder } from "./mediation-board";

type Session = "khaled" | "sara" | "joint";
type Stage = "brief" | "pre" | Session | "plan" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, khaled: 1, sara: 2, joint: 3, plan: 4, post: 5, debrief: 5 };
const graphs: Record<Session, DialogueGraph> = { khaled: khaledSession, sara: saraSession, joint: jointSession };
const nextStage: Record<Session, Stage> = { khaled: "sara", sara: "joint", joint: "plan" };

const fresh = () => ({ khaled: startDialogue(khaledSession), sara: startDialogue(saraSession), joint: startDialogue(jointSession) });

export function HrLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [sessions, setSessions] = useState<Record<Session, DialogueState>>(fresh);
  const [plan, setPlan] = useState<string[]>([]);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setSessions(fresh());
    setPlan([]);
    setResult(null);
  };

  const finish = (post: QuizResult) => {
    const { scorecard, peaceMade } = scoreHr(sessions, plan);
    setResult(finishAttempt(lab.slug, scorecard, { peaceMade }, pre, post, clock.elapsedSeconds()));
    setStage("debrief");
  };

  const allFacts = [...new Set([...sessions.khaled.facts, ...sessions.sara.facts, ...sessions.joint.facts])];
  const session = stage === "khaled" || stage === "sara" || stage === "joint" ? stage : null;

  const hud = session ? (
    <ObjectivesHud
      items={[
        { label: "أسباب مكتشفة", value: `${allFacts.length} / 5`, done: allFacts.length === 5 },
        { label: "الجلسة", value: graphs[session].title },
        { label: "التوتر", value: `${sessions[session].meters.tension}٪`, done: sessions[session].meters.tension <= 35 },
      ]}
    />
  ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? (
        <>
          <BriefingCard lab={lab} onStart={() => setStage("pre")} extra={<CaseFile />} />
          <PolicyCard />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={hrPreQuiz}
          onDone={(r) => {
            setPre(r);
            setStage("khaled");
          }}
        />
      ) : null}
      {session ? (
        <PersonaChat
          key={session}
          graph={graphs[session]}
          state={sessions[session]}
          onChoose={(id) => setSessions((s) => ({ ...s, [session]: choose(graphs[session], s[session], id) }))}
          onContinue={() => setStage(nextStage[session])}
          continueLabel={session === "joint" ? "اكتب خطة الحل" : "الجلسة التالية"}
          factLabels={hrFacts}
          aside={<PolicyCard compact />}
        />
      ) : null}
      {stage === "plan" ? (
        <ResolutionBuilder
          facts={allFacts}
          onDone={(actions) => {
            setPlan(actions);
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={hrPostQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? <LabScorecard lab={lab} result={result} onRetry={restart} /> : null}
    </LabShell>
  );
}
