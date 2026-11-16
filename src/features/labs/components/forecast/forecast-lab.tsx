"use client";

import { LineChart } from "lucide-react";
import { useState } from "react";

import { useLabSession } from "../../api";
import {
  actuals,
  actualsHead,
  buildInvestorQa,
  forecastCauses,
  forecastFacts,
  forecastMemo,
  forecastPostQuiz,
  forecastPreQuiz,
  scoreForecast,
  unitNotes,
} from "../../content/forecast";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { defaultDrivers, type Drivers, type Funding } from "../../model/forecast-sim";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel, Stat } from "../bits";
import { BriefingCard } from "../briefing-card";
import { RootCausePicker } from "../deals/root-cause-picker";
import { DataTable } from "../workspace/data-table";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { SourcesPanel } from "../workspace/sources-panel";
import { FundingStep, ModelStep } from "./forecast-model";

type Stage = "brief" | "pre" | "diagnose" | "model" | "funding" | "qa" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, diagnose: 1, model: 2, funding: 3, qa: 4, post: 5, debrief: 5 };

function ActualsPanel() {
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <LineChart className="size-5 text-sky" aria-hidden /> آخر ستة أشهر (فعلي)
        </span>
      }
      subtitle="من نظام المحاسبة ولوحة الاشتراكات. المبالغ بالريال."
    >
      <DataTable head={[...actualsHead]} rows={actuals} />
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {unitNotes.map((note) => (
          <li key={note} className="rounded-photo border border-line px-3 py-2 text-[13px] leading-6 text-fg-muted">
            {note}
          </li>
        ))}
      </ul>
    </LabPanel>
  );
}

export function ForecastLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [causes, setCauses] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Drivers>(defaultDrivers);
  const [funding, setFunding] = useState<Funding>("none");
  const [graph, setGraph] = useState<DialogueGraph | null>(null);
  const [qa, setQa] = useState<DialogueState | null>(null);
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
    setCauses([]);
    setDrivers(defaultDrivers);
    setFunding("none");
    setGraph(null);
    setQa(null);
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    if (!qa) return;
    const run = { causes, drivers, funding, qa };
    const { scorecard, runwayKeeper } = scoreForecast(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "forecast", run, pre, post, elapsed_seconds: clock.elapsedSeconds() },
      () => finishAttempt(lab.slug, scorecard, { runwayKeeper }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const facts = stage === "qa" ? forecastFacts(drivers, funding) : null;
  const hud =
    stage === "qa" && qa && facts ? (
      <ObjectivesHud
        items={[
          { label: "ثقة المستثمر", value: `${qa.meters.trust}٪`, done: qa.meters.trust >= 65 },
          { label: "المدرج", value: `${facts.base.runway} شهر`, done: facts.base.runway >= 18 },
          { label: "الهامش", value: `${facts.base.grossMargin}%`, done: facts.base.grossMargin >= 65 },
        ]}
      />
    ) : stage === "diagnose" || stage === "model" || stage === "funding" ? (
      <ObjectivesHud
        items={[
          { label: "النقد", value: "3.4M ر.س" },
          { label: "الحرق", value: "~326K / شهر" },
          { label: "الهدف", value: "مدرج 18 شهرًا · هامش 65٪" },
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
          <SourcesPanel slug="cfo-forecast-runway" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={forecastPreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("diagnose");
          }}
        />
      ) : null}
      {stage === "diagnose" ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ActualsPanel />
          <RootCausePicker
            causes={forecastCauses}
            title="ما الذي يهدد الشركة؟"
            subtitle="اختر حتى 3 مشكلات تدعمها الأرقام. تشخيصك يحدد أين تبدأ في النموذج."
            cta="افتح النموذج"
            onDone={(ids) => {
              setCauses(ids);
              void practice.submitForm("diagnose", { causes: ids });
              go("model");
            }}
          />
        </div>
      ) : null}
      {stage === "model" ? (
        <ModelStep
          initial={drivers}
          onDone={(next) => {
            setDrivers(next);
            void practice.simulateStep("model", { drivers: next });
            go("funding");
          }}
        />
      ) : null}
      {stage === "funding" ? (
        <FundingStep
          drivers={drivers}
          onDone={(choice) => {
            setFunding(choice);
            void practice.submitForm("funding", { funding: choice });
            const meeting = buildInvestorQa(drivers, choice);
            setGraph(meeting);
            setQa(startDialogue(meeting));
            go("qa");
          }}
        />
      ) : null}
      {stage === "qa" && graph && qa && facts ? (
        <PersonaChat
          graph={graph}
          state={qa}
          onChoose={(id) => {
            void practice.choose(graph.id, qa.nodeId, id);
            setQa((s) => (s ? choose(graph, s, id) : s));
          }}
          onContinue={() => go("post")}
          continueLabel="أنهِ الاجتماع"
          factLabels={{}}
          aside={
            <LabPanel title="أرقامك على الطاولة">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="مدرج أساسي" value={`${facts.base.runway} شهر`} />
                <Stat label="مدرج متشائم" value={`${facts.downside.runway} شهر`} />
                <Stat label="هامش ش12" value={`${facts.base.grossMargin}%`} />
                <Stat label="استرداد CAC" value={`${facts.base.payback} شهر`} />
              </div>
            </LabPanel>
          }
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={forecastPostQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("post", answers);
            void finish(r);
          }}
        />
      ) : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          <DocumentViewer
            doc={forecastMemo({ causes, drivers, funding }, qa?.outcome === "success")}
            fileName="مذكرة-التنبؤ-نقطة.pdf"
            signed={qa?.outcome === "success"}
            height="h-[min(70vh,760px)]"
          />
          <SourcesPanel slug="cfo-forecast-runway" />
        </>
      ) : null}
    </LabShell>
  );
}
