"use client";

import { Grid3x3, Scale, UsersRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useLabSession } from "../../api";
import {
  approvers,
  boardQuestions,
  boardScore,
  buildBoardMeeting,
  coiQuestions,
  coiQuotes,
  doaRows,
  governancePostQuiz,
  governancePreQuiz,
  minutesDoc,
  minutesScore,
  scoreGovernance,
  type BoardDesign,
} from "../../content/governance";
import { choose, startDialogue, type DialogueGraph, type DialogueState } from "../../model/dialogue";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel, MeterBar, OptionCard } from "../bits";
import { BriefingCard } from "../briefing-card";
import { DataTable } from "../workspace/data-table";
import { LabTable } from "../workspace/lab-table";
import { DocumentViewer } from "../documents/document-viewer";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { PersonaChat } from "../persona-chat";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { RedlineEditor } from "../workspace/redline-editor";
import { SourcesPanel } from "../workspace/sources-panel";

type Stage = "brief" | "pre" | "board" | "doa" | "coi" | "meeting" | "minutes" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, board: 1, doa: 2, coi: 3, meeting: 4, minutes: 5, post: 6, debrief: 6 };

function ChoiceGroups<T extends string>({
  groups,
  value,
  onChange,
}: {
  groups: readonly { id: T; label: string; options: readonly { id: string; label: string }[] }[];
  value: Readonly<Partial<Record<T, string>>>;
  onChange: (id: T, option: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.id} role="radiogroup" aria-label={group.label} className="flex flex-col gap-2">
          <h3 className="m-0 text-sm font-bold">{group.label}</h3>
          {group.options.map((option) => (
            <OptionCard key={option.id} selected={value[group.id] === option.id} onSelect={() => onChange(group.id, option.id)} title={option.label} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function GovernanceLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [design, setDesign] = useState<Partial<BoardDesign>>({});
  const [doa, setDoa] = useState<Record<string, string>>({});
  const [coi, setCoi] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState<Record<string, string>>({});
  const [graph, setGraph] = useState<DialogueGraph | null>(null);
  const [meeting, setMeeting] = useState<DialogueState | null>(null);
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
    setDesign({});
    setDoa({});
    setCoi({});
    setMinutes({});
    setGraph(null);
    setMeeting(null);
    setResult(null);
  };

  const finish = async (post: QuizResult) => {
    if (!meeting) return;
    const run = { design: design as BoardDesign, doa, coi, meeting, minutes };
    const { scorecard, governanceGuardian } = scoreGovernance(run);
    const outcome = await practice.complete(
      { engine: "legacy", scorer: "governance", run, pre, post, elapsed_seconds: clock.elapsedSeconds() },
      () => finishAttempt(lab.slug, scorecard, { governanceGuardian }, pre, post, clock.elapsedSeconds()),
    );
    setResult(outcome);
    setStage("debrief");
  };

  const designDone = boardQuestions.every((q) => design[q.id]);
  const hud =
    stage === "meeting" && meeting ? (
      <ObjectivesHud
        items={[
          { label: "ثقة المجلس بالإدارة", value: `${meeting.meters.trust}٪`, done: meeting.meters.trust >= 70 },
          { label: "التوتر", value: `${meeting.meters.tension}٪`, done: meeting.meters.tension <= 40 },
        ]}
      />
    ) : stage === "board" || stage === "doa" || stage === "coi" ? (
      <ObjectivesHud
        items={[
          { label: "الجولة", value: "بذرية · صندوق رواد" },
          { label: "الاجتماع الأول", value: "22 أبريل" },
          { label: "دورك", value: "أمين سر المجلس" },
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
          <SourcesPanel slug="governance-first-board" />
        </>
      ) : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={governancePreQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("pre", answers);
            setPre(r);
            go("board");
          }}
        />
      ) : null}
      {stage === "board" ? (
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <UsersRound className="size-5 text-accent" aria-hidden /> تشكيل المجلس واللجان
            </span>
          }
          subtitle="اتفاقية الاستثمار تطلب مجلسًا منظمًا خلال 60 يومًا. صمّمه لشركة من 14 موظفًا تخطط لجولة A."
        >
          <ChoiceGroups groups={boardQuestions} value={design} onChange={(id, option) => setDesign((d) => ({ ...d, [id]: option }))} />
          {designDone ? <MeterBar label="توازن التشكيل" value={boardScore(design as BoardDesign)} /> : null}
          <div className="flex justify-end">
            <Button
              disabled={!designDone}
              onClick={() => {
                void practice.submitForm("board", design);
                go("doa");
              }}
            >
              اعتمد التشكيل
            </Button>
          </div>
        </LabPanel>
      ) : null}
      {stage === "doa" ? (
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <Grid3x3 className="size-5 text-accent" aria-hidden /> مصفوفة الصلاحيات
            </span>
          }
          subtitle="من يعتمد كل قرار؟ اختر صاحب الاعتماد الأدنى المناسب."
        >
          <LabTable
            minWidth="min-w-[640px]"
            caption="مصفوفة الصلاحيات"
            columns={[
              { key: "decision", label: "القرار", className: "font-semibold" },
              ...approvers.map((a) => ({ key: a.id, label: a.label, align: "center" as const })),
            ]}
            rows={doaRows.map((row) => ({
              key: row.id,
              className: "has-[:checked]:bg-surface-alt/30",
              cells: [
                row.label,
                ...approvers.map((a) => (
                  <input
                    key={a.id}
                    type="radio"
                    name={`doa-${row.id}`}
                    aria-label={`${row.label}: ${a.label}`}
                    className="size-4 accent-[var(--accent)]"
                    checked={doa[row.id] === a.id}
                    onChange={() => setDoa((d) => ({ ...d, [row.id]: a.id }))}
                  />
                )),
              ],
            }))}
          />
          <div className="flex justify-end">
            <Button
              disabled={doaRows.some((row) => !doa[row.id])}
              onClick={() => {
                void practice.submitForm("doa", doa);
                go("coi");
              }}
            >
              اعتمد المصفوفة
            </Button>
          </div>
        </LabPanel>
      ) : null}
      {stage === "coi" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <LabPanel
            title={
              <span className="inline-flex items-center gap-2">
                <Scale className="size-5 text-pink" aria-hidden /> عروض توريد أجهزة نقاط البيع
              </span>
            }
            subtitle="400 جهاز لوحي لعملاء الربع القادم. البند على جدول الاجتماع الأول."
          >
            <DataTable head={["المورد", "السعر (ر.س)", "الشروط"]} rows={coiQuotes} />
            <p className="m-0 rounded-photo bg-surface-alt px-3 py-2 text-[13px] leading-6">
              رسالة من الرئيس التنفيذي: «ريم رشحت تقنيات الشهري، تعاملنا معهم سابقًا. ضعه على الجدول للاعتماد.»
            </p>
          </LabPanel>
          <LabPanel title="إدارة التعارض" subtitle="ثلاثة قرارات قبل الاجتماع.">
            {coiQuestions.map((q) => (
              <div key={q.id} role="radiogroup" aria-label={q.label} className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-bold">{q.label}</h3>
                {q.options.map((option) => (
                  <OptionCard key={option.id} selected={coi[q.id] === option.id} onSelect={() => setCoi((c) => ({ ...c, [q.id]: option.id }))} title={option.label} />
                ))}
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                disabled={coiQuestions.some((q) => !coi[q.id])}
                onClick={() => {
                  void practice.submitForm("coi", coi);
                  const call = buildBoardMeeting({
                    coiHandled: coi.disclosure === "written",
                    auditIndependent: design.audit === "independent",
                  });
                  setGraph(call);
                  setMeeting(startDialogue(call));
                  go("meeting");
                }}
              >
                ادخل الاجتماع
              </Button>
            </div>
          </LabPanel>
        </div>
      ) : null}
      {stage === "meeting" && graph && meeting ? (
        <PersonaChat
          graph={graph}
          state={meeting}
          onChoose={(id) => {
            void practice.choose(graph.id, meeting.nodeId, id);
            setMeeting((s) => (s ? choose(graph, s, id) : s));
          }}
          onContinue={() => go("minutes")}
          continueLabel="اكتب المحضر"
          factLabels={{}}
        />
      ) : null}
      {stage === "minutes" ? (
        <RedlineEditor
          doc={() => minutesDoc()}
          fileName="محضر-المجلس-1-2026.pdf"
          gauge={(redlines) => (
            <LabPanel title="دقة المحضر">
              <MeterBar label="مطابقة المحضر لما جرى" value={minutesScore(redlines)} />
            </LabPanel>
          )}
          cta="أرسل المحضر للتوقيع"
          onChange={(clauseId, optionId) => void practice.redline("minutes", clauseId, optionId)}
          onDone={(redlines) => {
            setMinutes(redlines);
            go("post");
          }}
        />
      ) : null}
      {stage === "post" ? (
        <SkillQuiz
          mode="post"
          questions={governancePostQuiz}
          onDone={(r, answers) => {
            void practice.submitQuiz("post", answers);
            void finish(r);
          }}
        />
      ) : null}
      {stage === "debrief" && result ? (
        <>
          <LabScorecard lab={lab} result={result} onRetry={restart} />
          <DocumentViewer doc={minutesDoc()} fileName="محضر-المجلس-1-2026.pdf" redlines={minutes} signed={minutesScore(minutes) >= 80} height="h-[min(70vh,760px)]" />
          <SourcesPanel slug="governance-first-board" />
        </>
      ) : null}
    </LabShell>
  );
}
