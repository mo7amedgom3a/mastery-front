"use client";

import { useState } from "react";

import type { ObjectionScenario, ObjectionCrmEntry, RoundResult } from "../../content/objections/types";
import { isClassify } from "../../content/objections/types";
import { scoreObjectionTypes, scoreRuler } from "../../content/objections/score";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import type { ChatEntry } from "../chat-frame";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { CommitmentStep, CrmStep } from "./commitment-step";
import { DossierCard } from "./dossier-card";
import { ObjectionArena } from "./objection-arena";
import { RulerBoard } from "./ruler-board";

type Stage = "brief" | "pre" | "dossier" | "mechanic" | "commit" | "crm" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, dossier: 1, mechanic: 2, commit: 3, crm: 4, post: 5, debrief: 5 };

/** Shared runner for the six-type drill and the competitor-ruler case. */
export function ObjectionLab({ lab, scenario }: { lab: LabDefinition; scenario: ObjectionScenario }) {
  const clock = usePracticeClock();
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [rulerSteps, setRulerSteps] = useState<Record<string, string>>({});
  const [benefits, setBenefits] = useState<string[]>([]);
  const [trust, setTrust] = useState(40);
  const [tension, setTension] = useState(30);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [crm, setCrm] = useState<ObjectionCrmEntry | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    setPre(null);
    setRounds([]);
    setHistory([]);
    setRoundIndex(0);
    setRulerSteps({});
    setBenefits([]);
    setTrust(40);
    setTension(30);
    setCommitment(null);
    setCrm(null);
    setResult(null);
    clock.reset();
  };

  const finish = (post: QuizResult) => {
    if (!crm) return;
    const run = { rounds, rulerSteps, benefits, commitment, crm, trust, tension };
    if (isClassify(scenario)) {
      const { scorecard, objectionReader } = scoreObjectionTypes(scenario, run);
      setResult(finishAttempt(lab.slug, scorecard, { objectionReader }, pre, post, clock.elapsedSeconds()));
    } else {
      const { scorecard, rulerMaster } = scoreRuler(scenario, run);
      setResult(finishAttempt(lab.slug, scorecard, { rulerMaster }, pre, post, clock.elapsedSeconds()));
    }
    setStage("debrief");
  };

  const hud =
    stage === "mechanic" ? (
      <ObjectivesHud
        items={
          isClassify(scenario)
            ? [
                { label: "الجولة", value: `${Math.min(roundIndex + 1, scenario.rounds.length)} / ${scenario.rounds.length}` },
                { label: "الثقة", value: `${trust}٪`, done: trust >= 60 },
                { label: "التوتر", value: `${tension}٪`, done: tension <= 40 },
                { label: "الهدف", value: "التزام مكتوب" },
              ]
            : [
                { label: "المسطرة", value: "5 خطوات" },
                { label: "الثقة", value: `${trust}٪`, done: trust >= 60 },
                { label: "التوتر", value: `${tension}٪`, done: tension <= 40 },
                { label: "الهدف", value: "تجربة على شركة" },
              ]
        }
      />
    ) : null;

  const currentRound = isClassify(scenario) ? scenario.rounds[roundIndex] : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? (
        <BriefingCard
          lab={lab}
          onStart={() => {
            clock.reset();
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
            setStage("dossier");
          }}
        />
      ) : null}
      {stage === "dossier" ? <DossierCard scenario={scenario} onStart={() => setStage("mechanic")} /> : null}
      {stage === "mechanic" && isClassify(scenario) && currentRound ? (
        <ObjectionArena
          key={currentRound.id}
          round={currentRound}
          persona={scenario.contact}
          index={roundIndex}
          total={scenario.rounds.length}
          trust={trust}
          tension={tension}
          history={history}
          onDone={(roundResult, entries) => {
            const next = [...rounds, roundResult];
            setRounds(next);
            setHistory((current) => [...current, ...entries]);
            setTrust(roundResult.trust);
            setTension(roundResult.tension);
            if (roundIndex + 1 >= scenario.rounds.length) setStage("commit");
            else setRoundIndex(roundIndex + 1);
          }}
        />
      ) : null}
      {stage === "mechanic" && !isClassify(scenario) ? (
        <RulerBoard
          scenario={scenario}
          onDone={(done) => {
            setRulerSteps(done.steps);
            setBenefits(done.benefits);
            setTrust(done.trust);
            setTension(done.tension);
            setStage("commit");
          }}
        />
      ) : null}
      {stage === "commit" ? (
        <CommitmentStep
          scenario={scenario}
          onDone={(value) => {
            setCommitment(value);
            setStage("crm");
          }}
        />
      ) : null}
      {stage === "crm" ? (
        <CrmStep
          scenario={scenario}
          onDone={(entry) => {
            setCrm(entry);
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={scenario.postQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? <LabScorecard lab={lab} result={result} onRetry={restart} /> : null}
    </LabShell>
  );
}
