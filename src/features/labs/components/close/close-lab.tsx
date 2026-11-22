"use client";

import { useState } from "react";

import { useLabSession } from "../../api";
import {
  buildCloseReview,
  closeFacts,
  closePack,
  closePostQuiz,
  closePreQuiz,
  scoreClose,
  type CloseRun,
} from "../../content/close";
import type { CloseDay, ExceptionKind, JournalEntry } from "../../model/close-engine";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { SourcesPanel } from "../workspace/sources-panel";
import { CalendarStep, EntriesStep, ReconciliationStep, VarianceStep, VatStep } from "./close-steps";

type Stage = "brief" | "pre" | "calendar" | "rec" | "entries" | "vat" | "variance" | "review" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, calendar: 1, rec: 2, entries: 3, vat: 4, variance: 5, review: 6, post: 7, debrief: 7 };

type Draft = Omit<CloseRun, "review">;
const emptyDraft: Draft = { plan: {}, pairs: [], classes: {}, entries: {}, deducted: [], due: "", flags: [], reasons: {} };

export function CloseLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [graph, setGraph] = useState<DialogueGraph | null>(null);
  const [review, setReview] = useState<DialogueState | null>(null);
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
    setDraft(emptyDraft);
    setGraph(null);
    setReview(null);
    setResult(null);
  };

  const enterReview = (next: Draft) => {
    const meeting = buildCloseReview(closeFacts(next));
    setGraph(meeting);
    setReview(startDialogue(meeting));
    go("review");
  };

  const finish = async (post: QuizResult) => {
    if (!review) return;
    const run: CloseRun = { ...draft, review };
    const { scorecard, cleanClose } = scoreClose(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "close", run, pre, post, elapsed_seconds: clock.elapsedSeconds(), client_result: { scorecard, signals: { cleanClose } } },
      () => finishAttempt(lab.slug, scorecard, { cleanClose }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const facts = stage === "review" || stage === "post" || stage === "debrief" ? closeFacts(draft) : null;
  const hud =
    stage === "review" && review ? (
      <ObjectivesHud
        items={[
          { label: "ثقة المراجعة", value: `${review.meters.trust}٪`, done: review.meters.trust >= 65 },
          { label: "فرق التسوية", value: facts ? facts.recDiff.toLocaleString("en-US") : "—", done: facts?.recDiff === 0 },
          { label: "القيود الصحيحة", value: `${facts?.entriesRight ?? 0} / 3`, done: facts?.entriesRight === 3 },
        ]}
      />
    ) : stage !== "brief" && stage !== "pre" && stage !== "debrief" ? (
      <ObjectivesHud
        items={[
          { label: "الفترة", value: "الربع الثالث 2026" },
          { label: "التوقيع", value: "يوم العمل 5" },
          { label: "إقرار الضريبة", value: "31 أكتوبر" },
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
          <SourcesPanel slug="finance-quarter-close" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={closePreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("calendar");
          }}
        />
      ) : null}
      {stage === "calendar" ? (
        <CalendarStep
          onDone={(plan: Record<string, CloseDay>) => {
            void practice.submitForm("calendar", { plan });
            setDraft((d) => ({ ...d, plan }));
            go("rec");
          }}
        />
      ) : null}
      {stage === "rec" ? (
        <ReconciliationStep
          onDone={(pairs, classes: Record<string, ExceptionKind>) => {
            void practice.submitForm("rec", { pairs, classes });
            setDraft((d) => ({ ...d, pairs, classes }));
            go("entries");
          }}
        />
      ) : null}
      {stage === "entries" ? (
        <EntriesStep
          onDone={(entries: Record<string, JournalEntry>) => {
            void practice.submitForm("entries", { entries });
            setDraft((d) => ({ ...d, entries }));
            go("vat");
          }}
        />
      ) : null}
      {stage === "vat" ? (
        <VatStep
          onDone={(deducted, due) => {
            void practice.submitForm("vat", { deducted, due });
            setDraft((d) => ({ ...d, deducted, due }));
            go("variance");
          }}
        />
      ) : null}
      {stage === "variance" ? (
        <VarianceStep
          onDone={(flags, reasons) => {
            void practice.submitForm("variance", { flags, reasons });
            const next = { ...draft, flags, reasons };
            setDraft(next);
            enterReview(next);
          }}
        />
      ) : null}
      {stage === "review" && graph && review ? (
        <PersonaChat
          graph={graph}
          state={review}
          onChoose={(id) => {
            void practice.choose(graph.id, review.nodeId, id);
            setReview((s) => (s ? choose(graph, s, id) : s));
          }}
          onContinue={() => go("post")}
          continueLabel="أنهِ المراجعة"
          factLabels={{}}
          aside={<DocumentViewer doc={closePack(draft, false)} fileName="حزمة-إقفال-الربع-الثالث.pdf" height="h-[min(60vh,620px)]" />}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={closePostQuiz}
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
            doc={closePack(draft, review?.outcome === "success")}
            fileName="حزمة-إقفال-الربع-الثالث.pdf"
            signed={review?.outcome === "success"}
            height="h-[min(70vh,760px)]"
          />
          <SourcesPanel slug="finance-quarter-close" />
        </>
      ) : null}
    </LabShell>
  );
}
