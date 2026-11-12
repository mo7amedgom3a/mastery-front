"use client";

import { MessageSquareQuote, Newspaper } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { boardReport, buildBoardMeeting, ceoCauses, ceoPostQuiz, ceoPreQuiz, marketBrief, scoreCeo } from "../../content/ceo";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { QUARTERS, emptyAllocation, simulateQuarter, startMarket, type Allocation, type MarketState } from "../../model/market-sim";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel } from "../bits";
import { BriefingCard } from "../briefing-card";
import { RootCausePicker } from "../deals/root-cause-picker";
import { DocBlockView } from "../documents/doc-blocks";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { KpiBoard } from "./kpi-board";
import { QuarterPlanner } from "./quarter-planner";

type Stage = "brief" | "pre" | "diagnose" | "quarters" | "board" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, diagnose: 1, quarters: 2, board: 3, post: 4, debrief: 4 };
/** Seed for this demo's market: every learner faces the same quarters. */
const SEED = 7;
const startingAllocation: Allocation = { ...emptyAllocation, price: 15, marketing: 25, delivery: 20, loyalty: 15, b2b: 10, cost: 15 };
const boardFacts: Record<string, string> = {};

function MarketBrief() {
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Newspaper className="size-5 text-coral" aria-hidden /> ملخص السوق من فريق التحليل
        </span>
      }
      subtitle="حصتنا هبطت من 34٪ إلى 27٪ خلال ربعين. اقرأ البيانات قبل أن تقرر."
    >
      <DocBlockView block={{ kind: "table", head: ["الشريحة", "التسرب الشهري", "الاتجاه"], rows: marketBrief.churn }} />
      <div className="grid gap-4 md:grid-cols-2">
        <DocBlockView block={{ kind: "table", head: ["زمن التوصيل", "المتوسط"], rows: marketBrief.delivery }} />
        <DocBlockView block={{ kind: "table", head: ["اقتصاديات فوري", "القيمة"], rows: marketBrief.rival }} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
          <MessageSquareQuote className="size-4 text-sky" aria-hidden /> من تعليقات العملاء
        </h3>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {marketBrief.comments.map((c) => (
            <li key={c} className="rounded-photo border border-line px-3 py-2 text-[13px] leading-6 text-fg-muted">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </LabPanel>
  );
}

export function CeoLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [causes, setCauses] = useState<string[]>([]);
  const [market, setMarket] = useState<MarketState>(startMarket);
  const [graph, setGraph] = useState<DialogueGraph | null>(null);
  const [board, setBoard] = useState<DialogueState | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setCauses([]);
    setMarket(startMarket());
    setGraph(null);
    setBoard(null);
    setResult(null);
  };

  const enterBoard = () => {
    const meeting = buildBoardMeeting(market);
    setGraph(meeting);
    setBoard(startDialogue(meeting));
    setStage("board");
  };

  const finish = (post: QuizResult) => {
    if (!board) return;
    const { scorecard, shareDefended } = scoreCeo({ market, causes, board });
    setResult(finishAttempt(lab.slug, scorecard, { shareDefended }, pre, post, clock.elapsedSeconds()));
    setStage("debrief");
  };

  const done = market.quarter >= QUARTERS;
  const hud =
    stage === "quarters" ? (
      <ObjectivesHud
        items={[
          { label: "الربع", value: `${Math.min(market.quarter + 1, QUARTERS)} / ${QUARTERS}` },
          { label: "الحصة", value: `${market.share}%`, done: market.share >= 32 },
          { label: "مدة النقد", value: `${market.runway} شهر`, done: market.runway >= 12 },
          { label: "NPS", value: market.nps, done: market.nps >= 40 },
        ]}
      />
    ) : stage === "board" && board ? (
      <ObjectivesHud
        items={[
          { label: "ثقة المجلس", value: `${board.meters.trust}٪`, done: board.meters.trust >= 65 },
          { label: "الهدف", value: "اعتماد ميزانية العام القادم" },
        ]}
      />
    ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? <BriefingCard lab={lab} onStart={() => setStage("pre")} /> : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={ceoPreQuiz}
          onDone={(r) => {
            setPre(r);
            setStage("diagnose");
          }}
        />
      ) : null}
      {stage === "diagnose" ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <MarketBrief />
          <RootCausePicker
            causes={ceoCauses}
            title="لماذا نخسر الحصة؟"
            subtitle="اختر حتى 3 أسباب تدعمها البيانات. تشخيصك يظهر في تقرير المجلس."
            cta="ابدأ الربع الأول"
            onDone={(ids) => {
              setCauses(ids);
              setStage("quarters");
            }}
          />
        </div>
      ) : null}
      {stage === "quarters" ? (
        <>
          <KpiBoard market={market} />
          {done ? (
            <LabPanel title="انتهت السنة" subtitle="مسودة تقرير المجلس جاهزة من أرقامك. راجعها ثم ادخل الاجتماع.">
              <DocumentViewer doc={boardReport(market, false)} fileName="تقرير-المجلس-سلة-الحي.pdf" height="h-[min(60vh,640px)]" />
              <div className="flex justify-end">
                <Button size="lg" onClick={enterBoard}>
                  ادخل اجتماع المجلس
                </Button>
              </div>
            </LabPanel>
          ) : (
            <QuarterPlanner
              key={market.quarter}
              quarter={market.quarter + 1}
              initial={market.history.at(-1)?.allocation ?? startingAllocation}
              onRun={(allocation, choice) => setMarket((m) => simulateQuarter(m, allocation, choice, SEED))}
            />
          )}
        </>
      ) : null}
      {stage === "board" && graph && board ? (
        <PersonaChat
          graph={graph}
          state={board}
          onChoose={(id) => setBoard((s) => (s ? choose(graph, s, id) : s))}
          onContinue={() => setStage("post")}
          continueLabel="أنهِ الاجتماع"
          factLabels={boardFacts}
          aside={<KpiBoard market={market} />}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={ceoPostQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          <DocumentViewer
            doc={boardReport(market, board?.outcome === "success")}
            fileName="تقرير-المجلس-سلة-الحي.pdf"
            signed={board?.outcome === "success"}
            height="h-[min(70vh,760px)]"
          />
        </>
      ) : null}
    </LabShell>
  );
}
