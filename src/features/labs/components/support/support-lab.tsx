"use client";

import { useState } from "react";

import {
  compensationDoc,
  scoreSupport,
  supportChat,
  supportFacts,
  supportPostQuiz,
  supportPreQuiz,
  type CompensationForm,
  type Triage,
} from "../../content/support";
import { choose, startDialogue, type DialogueState } from "../../model/dialogue";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { BriefingCard } from "../briefing-card";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { CompensationStep } from "./compensation-form";
import { CustomerCard, PolicyPanel, TicketConsole } from "./ticket-console";

type Stage = "brief" | "pre" | "console" | "chat" | "resolve" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, console: 1, chat: 2, resolve: 3, post: 4, debrief: 4 };

export function SupportLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [triage, setTriage] = useState<Triage>({ priority: null, tags: [] });
  const [triageSeconds, setTriageSeconds] = useState(0);
  const [chat, setChat] = useState<DialogueState>(() => startDialogue(supportChat));
  const [form, setForm] = useState<CompensationForm | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setTriage({ priority: null, tags: [] });
    setTriageSeconds(0);
    setChat(startDialogue(supportChat));
    setForm(null);
    setNotes([]);
    setResult(null);
  };

  const finish = (post: QuizResult) => {
    if (!form) return;
    const { scorecard, coolHead } = scoreSupport({ triage, triageSeconds, chat, form, notes });
    setResult(finishAttempt(lab.slug, scorecard, { coolHead }, pre, post, clock.elapsedSeconds()));
    setStage("debrief");
  };

  const hud =
    stage === "chat" ? (
      <ObjectivesHud
        items={[
          { label: "التوتر", value: `${chat.meters.tension}٪`, done: chat.meters.tension <= 30 },
          { label: "الثقة", value: `${chat.meters.trust}٪`, done: chat.meters.trust >= 60 },
          { label: "معلومات مكتشفة", value: `${chat.facts.length} / 5`, done: chat.facts.length === 5 },
          { label: "صلاحيتك", value: "300 ر.س" },
        ]}
      />
    ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? <BriefingCard lab={lab} onStart={() => setStage("pre")} /> : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={supportPreQuiz}
          onDone={(r) => {
            setPre(r);
            setStage("console");
          }}
        />
      ) : null}
      {stage === "console" ? (
        <TicketConsole
          onDone={(t, seconds) => {
            setTriage(t);
            setTriageSeconds(seconds);
            setStage("chat");
          }}
        />
      ) : null}
      {stage === "chat" ? (
        <PersonaChat
          graph={supportChat}
          state={chat}
          onChoose={(id) => setChat((s) => choose(supportChat, s, id))}
          onContinue={() => setStage("resolve")}
          continueLabel="املأ نموذج التعويض"
          factLabels={supportFacts}
          aside={
            <>
              <PolicyPanel />
              <CustomerCard />
            </>
          }
        />
      ) : null}
      {stage === "resolve" ? (
        <CompensationStep
          triage={triage}
          onDone={(f, n) => {
            setForm(f);
            setNotes(n);
            setStage("post");
          }}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={supportPostQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          {form ? <DocumentViewer doc={compensationDoc(form, triage, true)} fileName="نموذج-اعتماد-تعويض-48213.pdf" signed height="h-[min(70vh,760px)]" /> : null}
        </>
      ) : null}
    </LabShell>
  );
}
