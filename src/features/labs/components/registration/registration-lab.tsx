"use client";

import { useState } from "react";

import { useLabSession } from "../../api";
import {
  articlesDoc,
  buildOfficerCall,
  officerDelay,
  registrationFile,
  registrationPostQuiz,
  registrationPreQuiz,
  scoreRegistration,
  services,
} from "../../content/registration";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { delay, startPortal, submit, type PortalState } from "../../model/portal-flow";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { chosenOption, redlinableClauses } from "../documents/doc-types";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { SourcesPanel } from "../workspace/sources-panel";
import { ArticlesStep, LegalFormStep, PortalStep } from "./registration-steps";

type Stage = "brief" | "pre" | "form" | "articles" | "portal" | "officer" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, form: 1, articles: 2, portal: 3, officer: 4, post: 5, debrief: 5 };

export function RegistrationLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [form, setForm] = useState("");
  const [articles, setArticles] = useState({ tradeName: "", management: "", redlines: {} as Record<string, string> });
  const [portal, setPortal] = useState<PortalState>(startPortal);
  const [graph, setGraph] = useState<DialogueGraph | null>(null);
  const [officer, setOfficer] = useState<DialogueState | null>(null);
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
    setForm("");
    setArticles({ tradeName: "", management: "", redlines: {} });
    setPortal(startPortal());
    setGraph(null);
    setOfficer(null);
    setResult(null);
  };

  const onSubmit = (id: string) => {
    void practice.simulateStep("portal", { submit: id });
    const next = submit(services, portal, id);
    // The first approvable CR application comes back with a note: resolve it with the officer.
    if (id === "cr" && next.approved.includes("cr") && !officer) {
      const contribution = redlinableClauses(articlesDoc({ form, ...articles })).find((c) => c.id === "contribution");
      const contributionOk = contribution ? Boolean(chosenOption(contribution, articles.redlines)?.balanced) : true;
      const call = buildOfficerCall({ tradeName: articles.tradeName, contributionOk });
      setGraph(call);
      setOfficer(startDialogue(call));
      go("officer");
      return;
    }
    setPortal(next);
  };

  const finish = async (post: QuizResult) => {
    if (!officer) return;
    const run = { form, ...articles, portal, officer };
    const { scorecard, founder } = scoreRegistration(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "registration", run, pre, post, elapsed_seconds: clock.elapsedSeconds() },
      () => finishAttempt(lab.slug, scorecard, { founder }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const hud =
    stage === "portal" || stage === "officer" ? (
      <ObjectivesHud
        items={[
          { label: "المعتمد", value: `${portal.approved.length} / ${services.filter((s) => s.required).length}` },
          { label: "مرفوض", value: portal.log.filter((l) => l.status === "rejected").length, done: !portal.log.some((l) => l.status === "rejected") },
          ...(officer ? [{ label: "تعاون الموظف", value: `${officer.meters.trust}٪`, done: officer.meters.trust >= 60 }] : []),
        ]}
      />
    ) : stage === "form" || stage === "articles" ? (
      <ObjectivesHud
        items={[
          { label: "الشركاء", value: "3 (أحدهم أجنبي)" },
          { label: "رأس المال", value: "500,000 ر.س" },
          { label: "الهدف", value: "جاهز للتشغيل والتوظيف" },
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
          <SourcesPanel slug="startup-company-registration" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={registrationPreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("form");
          }}
        />
      ) : null}
      {stage === "form" ? (
        <LegalFormStep
          onDone={(id) => {
            setForm(id);
            void practice.submitForm("form", { form: id });
            go("articles");
          }}
        />
      ) : null}
      {stage === "articles" ? (
        <ArticlesStep
          form={form}
          onRedline={(clauseId, optionId) => void practice.redline("articles", clauseId, optionId)}
          onDone={(value) => {
            setArticles(value);
            void practice.submitForm("articles", { trade_name: value.tradeName, management: value.management });
            go("portal");
          }}
        />
      ) : null}
      {stage === "portal" ? (
        <PortalStep
          state={portal}
          crReturned={Boolean(officer)}
          onSubmit={onSubmit}
          onFinish={() => go("post")}
        />
      ) : null}
      {stage === "officer" && graph && officer ? (
        <PersonaChat
          graph={graph}
          state={officer}
          onChoose={(id) => {
            void practice.choose(graph.id, officer.nodeId, id);
            setOfficer((s) => (s ? choose(graph, s, id) : s));
          }}
          onContinue={() => {
            setPortal((p) => delay(submit(services, p, "cr"), "cr", officerDelay(officer.outcome)));
            go("portal");
          }}
          continueLabel="عُد إلى البوابة"
          factLabels={{}}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={registrationPostQuiz}
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
            doc={registrationFile({ form, ...articles, portal }, portal, true)}
            fileName="ملف-تأسيس-نقطة.pdf"
            signed
            height="h-[min(70vh,760px)]"
          />
          <SourcesPanel slug="startup-company-registration" />
        </>
      ) : null}
    </LabShell>
  );
}
