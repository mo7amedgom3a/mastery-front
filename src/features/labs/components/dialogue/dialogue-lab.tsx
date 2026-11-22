"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useLabSession, type LiveLabRuntime } from "../../api";
import {
  DialoguePlayer,
  metersOf,
  resolveSpeakers,
  type DialogueRun,
  type DialogueScenarioDoc,
  type DialogueStageDoc,
  type FormStage,
  type RuntimeState,
  type SelectStage,
  type StageDoc,
} from "../../model/dialogue-runtime";
import { buildScorecard } from "../../model/scoring";
import type { LabDefinition, LabResult, LabSlug, QuizQuestion, QuizResult } from "../../model/types";
import { LabPanel, OptionCard } from "../bits";
import { BriefingCard } from "../briefing-card";
import { LabShell } from "../lab-shell";
import { LabScorecard } from "../scorecard";
import { SkillQuiz } from "../skill-quiz";
import { DialogueChat } from "./dialogue-chat";

type Step = { kind: "brief" } | { kind: "pre" } | { kind: "stage"; index: number } | { kind: "post" } | { kind: "debrief" };

const inputClass =
  "min-h-11 w-full rounded-ctl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent focus:ring-2 focus:ring-focus/40";

/** Learner-facing constraint line, e.g. «مدة المكالمة: 10 دقائق». */
function constraintLine(item: { label: { ar: string }; value?: unknown; unit?: string | null }): string {
  if (item.value === null || item.value === undefined || item.value === "") return item.label.ar;
  const value = typeof item.value === "number" ? item.value.toLocaleString("en-US") : String(item.value);
  return `${item.label.ar}: ${value}${item.unit ? ` ${item.unit}` : ""}`;
}

/** The live lab as the shared shell/briefing/scorecard components expect it. */
function toLabDefinition(runtime: LiveLabRuntime, doc: DialogueScenarioDoc): LabDefinition {
  const { card, definition } = runtime;
  const engine = runtime.engine_profile ?? doc.engine ?? null;
  const engineConstraints = (engine?.constraints ?? []).map(constraintLine);
  return {
    slug: card.slug as LabSlug,
    categoryLegacyId: card.field_category_id ?? 0,
    categoryName: card.category_name ?? "",
    title: card.title,
    tagline: card.tagline,
    role: definition.role || engine?.context?.learner_role || "",
    scenario: definition.scenario || doc.intro || engine?.context?.setting || "",
    targets: definition.targets,
    constraints: [...new Set([...definition.constraints, ...engineConstraints])],
    skills: card.skills,
    difficulty: card.difficulty,
    minutes: card.minutes,
    color: card.color,
    phases: doc.stages.map((stage) => stage.title),
    courseKeywords: definition.recommendations?.keywords ?? [],
  };
}

/**
 * Generic runner for labs on the `dialogue` runtime (admin engines such as sales discovery or HR
 * mediation): briefing → pre-quiz → the scenario's stages → post-quiz → server-scored debrief.
 * The learner's run (choices, selections, form values) is replayed and scored by the server.
 */
export function DialogueLab({ runtime, preview = false }: { runtime: LiveLabRuntime; preview?: boolean }) {
  const doc = runtime.scenario?.content as unknown as DialogueScenarioDoc;
  const lab = useMemo(() => toLabDefinition(runtime, doc), [runtime, doc]);
  const speakers = useMemo(() => resolveSpeakers(doc), [doc]);
  const meters = useMemo(() => metersOf(doc), [doc]);
  const config = doc.engine?.config ?? {};
  const preQuiz = (runtime.definition.pre_quiz ?? []) as QuizQuestion[];
  const postQuiz = (runtime.definition.post_quiz ?? []) as QuizQuestion[];

  const [step, setStep] = useState<Step>({ kind: "brief" });
  const [run, setRun] = useState<DialogueRun>({ stages: {} });
  const [dialogues, setDialogues] = useState<Record<string, RuntimeState>>({});
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);
  const [startedAt] = useState(() => Date.now());
  const session = useLabSession(runtime.card.slug, { preview, source: preview ? "admin-preview" : "dialogue-lab" });

  const players = useMemo(
    () =>
      Object.fromEntries(
        doc.stages.filter((stage): stage is DialogueStageDoc => stage.type === "dialogue").map((stage) => [stage.id, new DialoguePlayer(doc, stage)]),
      ),
    [doc],
  );

  const enterStage = (index: number) => {
    const stage = doc.stages[index];
    if (!stage) {
      if (postQuiz.length) setStep({ kind: "post" });
      else void finish(null);
      return;
    }
    if (stage.type === "dialogue" && !dialogues[stage.id]) {
      setDialogues((current) => ({ ...current, [stage.id]: players[stage.id].start() }));
    }
    setStep({ kind: "stage", index });
    void session.enterPhase(stage.id);
  };

  const begin = () => {
    void session.start();
    if (preQuiz.length) setStep({ kind: "pre" });
    else enterStage(0);
  };

  const record = (stageId: string, entry: DialogueRun["stages"][string]) =>
    setRun((current) => ({ stages: { ...current.stages, [stageId]: { ...current.stages[stageId], ...entry } } }));

  const finish = async (post: QuizResult | null) => {
    const fallback = (): LabResult => ({
      scorecard: buildScorecard({ dimensions: [], highlights: [], verdict: "تعذّر الوصول إلى خادم التقييم؛ أعد المحاولة لاحقًا." }),
      xp: 0,
      newBadges: [],
      pre,
      post,
    });
    const completed = await session.complete(
      { engine: "dialogue", run, pre, post, elapsed_seconds: Math.round((Date.now() - startedAt) / 1000) },
      fallback,
    );
    setResult(completed);
    setStep({ kind: "debrief" });
  };

  const stepIndex =
    step.kind === "brief" || step.kind === "pre" ? 0 : step.kind === "stage" ? step.index + 1 : doc.stages.length + 1;

  return (
    <LabShell lab={lab} step={stepIndex}>
      {session.error ? (
        <div role="alert" className="rounded-panel border border-pink/50 bg-pink/10 p-4 text-sm leading-7 text-fg">
          {session.error}
        </div>
      ) : null}

      {step.kind === "brief" ? (
        <BriefingCard lab={lab} onStart={begin} extra={<CastList speakers={Object.values(speakers)} />} />
      ) : step.kind === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={preQuiz}
          onDone={(quiz, answers) => {
            setPre(quiz);
            void session.submitQuiz("pre", answers);
            enterStage(0);
          }}
        />
      ) : step.kind === "post" ? (
        <SkillQuiz
          mode="post"
          questions={postQuiz}
          onDone={(quiz, answers) => {
            void session.submitQuiz("post", answers);
            void finish(quiz);
          }}
        />
      ) : step.kind === "debrief" && result ? (
        <LabScorecard lab={lab} result={result} onRetry={() => window.location.reload()} />
      ) : step.kind === "stage" ? (
        <StageView
          key={doc.stages[step.index].id}
          stage={doc.stages[step.index]}
          doc={doc}
          speakers={speakers}
          meters={meters}
          config={config}
          player={players[doc.stages[step.index].id]}
          state={dialogues[doc.stages[step.index].id]}
          pending={session.pending}
          last={step.index === doc.stages.length - 1 && !postQuiz.length}
          onChoose={(stageId, choiceId, nodeId) => {
            const player = players[stageId];
            const before = dialogues[stageId] ?? player.start();
            const after = player.choose(before, choiceId);
            setDialogues((current) => ({ ...current, [stageId]: after }));
            record(stageId, { choices: after.choices });
            void session.choose(stageId, nodeId, choiceId);
          }}
          onSubmit={(stageId, entry) => {
            record(stageId, entry);
            void session.submitForm(stageId, entry.values ?? { selected: entry.selected ?? [] });
          }}
          onNext={() => enterStage(step.index + 1)}
        />
      ) : null}
    </LabShell>
  );
}

function CastList({ speakers }: { speakers: ReturnType<typeof resolveSpeakers>[string][] }) {
  if (!speakers.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="m-0 text-lg font-bold">من ستقابل</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {speakers.map((speaker) => (
          <li key={speaker.id} className="rounded-photo border border-line px-3 py-2 text-sm leading-6">
            <span className="font-semibold">{speaker.name}</span>
            {speaker.role ? <span className="text-fg-muted"> · {speaker.role}</span> : null}
            {speaker.personality ? <p className="m-0 text-[13px] text-fg-muted">{speaker.personality}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StageView({
  stage,
  doc,
  speakers,
  meters,
  config,
  player,
  state,
  pending,
  last,
  onChoose,
  onSubmit,
  onNext,
}: {
  stage: StageDoc;
  doc: DialogueScenarioDoc;
  speakers: ReturnType<typeof resolveSpeakers>;
  meters: ReturnType<typeof metersOf>;
  config: NonNullable<NonNullable<DialogueScenarioDoc["engine"]>["config"]>;
  player?: DialoguePlayer;
  state?: RuntimeState;
  pending: boolean;
  last: boolean;
  onChoose: (stageId: string, choiceId: string, nodeId: string) => void;
  onSubmit: (stageId: string, entry: DialogueRun["stages"][string]) => void;
  onNext: () => void;
}) {
  const nextLabel = last ? "أنهِ واحصل على التقييم" : "متابعة";
  if (stage.type === "dialogue") {
    if (!player || !state) return null;
    return (
      <DialogueChat
        title={stage.title}
        player={player}
        state={state}
        speakers={speakers}
        meters={meters}
        visibleMeters={stage.visible_meters}
        facts={doc.facts ?? []}
        showMeters={config.show_meters !== false}
        showFacts={config.show_facts !== false}
        showTalkRatio={config.show_talk_ratio === true}
        onChoose={(choiceId, nodeId) => onChoose(stage.id, choiceId, nodeId)}
        onContinue={onNext}
        continueLabel={nextLabel}
      />
    );
  }
  if (stage.type === "brief") {
    return (
      <LabPanel title={stage.title}>
        {stage.body ? <p className="m-0 leading-8 whitespace-pre-line text-fg-muted">{stage.body}</p> : null}
        {stage.documents?.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {stage.documents.map((item) => (
              <li key={item.title} className="flex flex-col gap-1 rounded-photo border border-line p-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="size-4 text-accent" aria-hidden /> {item.title}
                </span>
                <span className="text-sm leading-7 whitespace-pre-line text-fg-muted">{item.body}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div>
          <Button onClick={onNext} disabled={pending}>
            {nextLabel}
          </Button>
        </div>
      </LabPanel>
    );
  }
  if (stage.type === "select") return <SelectView stage={stage} nextLabel={nextLabel} onDone={(selected) => { onSubmit(stage.id, { selected }); onNext(); }} />;
  return <FormView stage={stage} nextLabel={nextLabel} onDone={(values) => { onSubmit(stage.id, { values }); onNext(); }} />;
}

function SelectView({ stage, nextLabel, onDone }: { stage: SelectStage; nextLabel: string; onDone: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const multiple = stage.multiple !== false;
  const max = stage.max_select ?? (multiple ? stage.options.length : 1);
  const min = stage.min_select ?? 0;
  const toggle = (id: string) =>
    setSelected((current) => {
      if (!multiple) return [id];
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length >= max ? current : [...current, id];
    });
  return (
    <LabPanel title={stage.title} subtitle={stage.prompt}>
      <div className="grid gap-2 md:grid-cols-2" role={multiple ? "group" : "radiogroup"}>
        {stage.options.map((option) => (
          <OptionCard
            key={option.id}
            multi={multiple}
            selected={selected.includes(option.id)}
            onSelect={() => toggle(option.id)}
            title={option.label}
            detail={option.detail ?? undefined}
            disabled={multiple && !selected.includes(option.id) && selected.length >= max}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => onDone(selected)} disabled={selected.length < min}>
          {nextLabel}
        </Button>
        {min ? <span className="text-[13px] text-fg-muted">اختر {min} على الأقل</span> : null}
      </div>
    </LabPanel>
  );
}

function FormView({ stage, nextLabel, onDone }: { stage: FormStage; nextLabel: string; onDone: (values: Record<string, unknown>) => void }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const set = (id: string, value: unknown) => setValues((current) => ({ ...current, [id]: value }));
  const missing = stage.fields.some((field) => field.required && (values[field.id] === undefined || values[field.id] === "" || (Array.isArray(values[field.id]) && !(values[field.id] as unknown[]).length)));
  return (
    <LabPanel title={stage.title} subtitle={stage.prompt}>
      <div className="flex flex-col gap-4">
        {stage.fields.map((field) => {
          const kind = field.kind ?? "text";
          const id = `f-${stage.id}-${field.id}`;
          return (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-sm font-semibold">
                {field.label}
                {field.unit ? <span className="font-normal text-fg-muted"> ({field.unit})</span> : null}
                {field.required ? <span className="text-pink"> *</span> : null}
              </label>
              {kind === "select" ? (
                <select id={id} className={inputClass} value={String(values[field.id] ?? "")} onChange={(event) => set(field.id, event.target.value || null)}>
                  <option value="">—</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : kind === "multiselect" ? (
                <div id={id} className="grid gap-2 md:grid-cols-2">
                  {(field.options ?? []).map((option) => {
                    const current = (values[field.id] as string[] | undefined) ?? [];
                    const on = current.includes(option.id);
                    return (
                      <OptionCard
                        key={option.id}
                        multi
                        selected={on}
                        onSelect={() => set(field.id, on ? current.filter((item) => item !== option.id) : [...current, option.id])}
                        title={option.label}
                      />
                    );
                  })}
                </div>
              ) : kind === "number" ? (
                <input
                  id={id}
                  type="number"
                  dir="ltr"
                  inputMode="decimal"
                  className={cn(inputClass, "tabular-nums")}
                  placeholder={field.placeholder ?? undefined}
                  value={values[field.id] === undefined || values[field.id] === null ? "" : String(values[field.id])}
                  onChange={(event) => set(field.id, event.target.value === "" ? null : Number(event.target.value))}
                />
              ) : kind === "textarea" ? (
                <textarea id={id} rows={4} className={inputClass} placeholder={field.placeholder ?? undefined} value={String(values[field.id] ?? "")} onChange={(event) => set(field.id, event.target.value)} />
              ) : (
                <input id={id} className={inputClass} placeholder={field.placeholder ?? undefined} value={String(values[field.id] ?? "")} onChange={(event) => set(field.id, event.target.value)} />
              )}
            </div>
          );
        })}
      </div>
      <div>
        <Button onClick={() => onDone(values)} disabled={missing}>
          {nextLabel}
        </Button>
      </div>
    </LabPanel>
  );
}
