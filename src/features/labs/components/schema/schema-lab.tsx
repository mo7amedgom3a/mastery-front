"use client";

import { useMemo, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useLabSession, type LabField, type LabPathwayNode, type LabRuntime } from "../../api";
import { evaluateConditions } from "../../model/conditions";
import { buildScorecard } from "../../model/scoring";
import type { Dimension, LabResult } from "../../model/types";
import { LabPanel, Pill } from "../bits";
import { LabShell } from "../lab-shell";

type Values = Record<string, unknown>;
type Choices = Record<string, string>;

const inputClass =
  "min-h-11 w-full rounded-ctl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent focus:ring-2 focus:ring-focus/40";

function defaultsOf(runtime: LabRuntime): Values {
  return Object.fromEntries(runtime.fields.map((field) => [field.id, field.default ?? (field.type === "checkbox" ? false : field.type === "multiselect" ? [] : "")]));
}

/** A generic, schema-driven runner for admin-authored labs (and the Studio preview). */
export function SchemaLab({ runtime, preview = false }: { runtime: LabRuntime; preview?: boolean }) {
  const pathway = runtime.pathway;
  const [phaseId, setPhaseId] = useState<string | null>(pathway?.entry ?? runtime.phases[0]?.id ?? null);
  const [values, setValues] = useState<Values>(() => defaultsOf(runtime));
  const [choices, setChoices] = useState<Choices>({});
  const [result, setResult] = useState<LabResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const session = useLabSession(runtime.slug, { preview, source: preview ? "admin-preview" : "schema-lab" });

  // The shell's first chip is the briefing; drop the pathway's own brief phase so it is not shown
  // twice and the highlighted step matches the content.
  const briefPhaseId = useMemo(() => {
    if (!pathway) return undefined;
    const entry = pathway.entry ? pathway.nodes[pathway.entry] : undefined;
    if (entry?.type === "brief") return pathway.entry;
    return runtime.phases.find((phase) => phase.type === "brief")?.id;
  }, [pathway, runtime.phases]);

  const trail = useMemo(
    () => runtime.phases.filter((phase) => phase.id !== briefPhaseId),
    [runtime.phases, briefPhaseId],
  );

  const phaseIndex = useMemo(() => {
    const index = trail.findIndex((phase) => phase.id === phaseId);
    return index < 0 ? 0 : index;
  }, [trail, phaseId]);

  const node = phaseId && pathway ? pathway.nodes[phaseId] : null;
  const frame = { title: runtime.title, categoryName: runtime.category_name, phases: trail.map((phase) => phase.label) };
  // 0 = the briefing chip; each trail phase is +1; the debrief is the last chip.
  const step = result ? trail.length + 1 : phaseId === briefPhaseId ? 0 : phaseIndex + 1;

  const go = (next: string | undefined) => {
    if (!next) return;
    setPhaseId(next);
    void session.enterPhase(next);
  };

  const start = () => {
    void session.start();
    const entry = pathway?.entry ? pathway.nodes[pathway.entry] : null;
    go(entry?.next ?? runtime.phases[1]?.id);
  };

  const finish = async () => {
    setSubmitting(true);
    const dimensions: Dimension[] = runtime.scoring.dimensions.map((dimension) => ({
      key: dimension.key,
      label: dimension.label.ar,
      score: 60,
      weight: dimension.weight,
      skill: dimension.skill,
      praise: "أكملت المحاولة.",
      tip: "جرّب المحاولة مرة أخرى لتحسين القرار.",
    }));
    const fallback = (): LabResult => ({
      scorecard: buildScorecard({ dimensions, highlights: [], verdict: "أكملت المختبر التجريبي." }),
      xp: 0,
      newBadges: [],
      pre: null,
      post: null,
    });
    const completed = await session.complete({ engine: "schema", answers: { fields: values, choices }, pre: null, post: null, elapsed_seconds: 0 }, fallback);
    setResult(completed);
    setSubmitting(false);
  };

  if (!pathway) {
    return (
      <LabPanel title="هذا المختبر يعمل بمحرك مخصص">
        <p className="m-0 text-sm leading-7 text-fg-muted">لم يُعرّف مسار Pathway لهذا المختبر بعد.</p>
      </LabPanel>
    );
  }

  return (
    <LabShell lab={frame} step={step}>
      {session.error ? (
        <div role="alert" className="rounded-panel border border-pink/50 bg-pink/10 p-4 text-sm leading-7 text-fg">
          {session.error}
        </div>
      ) : null}

      {result ? (
        <SchemaResult runtime={runtime} result={result} onRetry={() => window.location.reload()} />
      ) : !node ? (
        <LabPanel title="المختبر غير مكتمل">
          <p className="m-0 text-sm leading-7 text-fg-muted">لا توجد مرحلة حالية.</p>
        </LabPanel>
      ) : node.type === "brief" ? (
        <Briefing runtime={runtime} onStart={start} />
      ) : node.type === "form" ? (
        <FormNode
          node={node}
          fields={runtime.fields}
          values={values}
          onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
          onSubmit={() => {
            void session.submitForm(node.id, values);
            go(node.next);
          }}
        />
      ) : node.type === "choice" || node.type === "dialogue" ? (
        <ChoiceNode
          node={node}
          persona={runtime.personas.find((persona) => persona.id === node.persona_id)}
          onChoose={(choiceId) => {
            setChoices((current) => ({ ...current, [node.id]: choiceId }));
            void session.choose("pathway", node.id, choiceId);
            go(node.choices?.find((choice) => choice.id === choiceId)?.next ?? node.next);
          }}
        />
      ) : node.type === "end" ? (
        <LabPanel title="أنهيت المختبر">
          <Button size="lg" block onClick={() => void finish()} disabled={submitting}>
            {submitting ? "جارٍ التقييم…" : "اعرض تقييمي"}
          </Button>
        </LabPanel>
      ) : (
        <LabPanel title={node.title?.ar ?? "مرحلة"}>
          <p className="m-0 text-sm leading-7 text-fg-muted">هذه المرحلة ({node.type}) تحتاج محركًا مخصصًا.</p>
          <Button onClick={() => go(node.next)}>متابعة</Button>
        </LabPanel>
      )}
    </LabShell>
  );
}

function Briefing({ runtime, onStart }: { runtime: LabRuntime; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <LabPanel title="الإحاطة">
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm leading-7 text-fg-muted">{runtime.scenario}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-photo border border-line p-4">
              <h3 className="m-0 text-sm font-bold">أهدافك</h3>
              <ul className="m-0 mt-2 flex list-disc flex-col gap-1 ps-5 text-sm leading-6">
                {runtime.targets.map((target) => (
                  <li key={target}>{target}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-photo border border-line p-4">
              <h3 className="m-0 text-sm font-bold">قيودك</h3>
              <ul className="m-0 mt-2 flex list-disc flex-col gap-1 ps-5 text-sm leading-6">
                {runtime.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button size="lg" block onClick={onStart}>
            ابدأ المختبر
          </Button>
        </div>
      </LabPanel>
    </div>
  );
}

function FormNode({
  node,
  fields,
  values,
  onChange,
  onSubmit,
}: {
  node: LabPathwayNode;
  fields: LabField[];
  values: Values;
  onChange: (id: string, value: unknown) => void;
  onSubmit: () => void;
}) {
  const visible = (node.fields ?? [])
    .map((id) => fields.find((field) => field.id === id))
    .filter((field): field is LabField => Boolean(field))
    .filter((field) => !field.visible_when?.length || evaluateConditions(field.visible_when, { field: values }));
  const missing = visible.filter((field) => field.required && isEmpty(values[field.id]));

  return (
    <LabPanel title={node.title?.ar ?? "نموذج"} subtitle="املأ الحقول المطلوبة ثم تابع.">
      <div className="flex flex-col gap-5">
        {visible.map((field) => (
          <SchemaField key={field.id} field={field} value={values[field.id]} onChange={(value) => onChange(field.id, value)} />
        ))}
        <Button size="lg" block onClick={onSubmit} disabled={missing.length > 0}>
          متابعة
        </Button>
        {missing.length ? <p className="m-0 text-center text-xs text-fg-muted">أكمل الحقول المطلوبة: {missing.map((field) => field.label.ar).join("، ")}</p> : null}
      </div>
    </LabPanel>
  );
}

function ChoiceNode({
  node,
  persona,
  onChoose,
}: {
  node: LabPathwayNode;
  persona?: { name: string; role: string };
  onChoose: (choiceId: string) => void;
}) {
  return (
    <LabPanel title={node.title?.ar ?? "قرار"} subtitle={persona ? `${persona.name} · ${persona.role}` : undefined}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-lg leading-8 font-bold">{node.prompt?.ar ?? "اختر خطوتك التالية."}</p>
        <div className="flex flex-col gap-2">
          {(node.choices ?? []).map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice.id)}
              className={cn(
                "rounded-photo border border-line p-3 text-start text-sm leading-6 transition-colors hover:border-accent",
              )}
            >
              {choice.label.ar}
            </button>
          ))}
        </div>
      </div>
    </LabPanel>
  );
}

export function SchemaField({ field, value, onChange }: { field: LabField; value: unknown; onChange: (value: unknown) => void }) {
  const label = (
    <span className="flex items-center gap-2 text-sm font-semibold">
      {field.label.ar}
      {field.required ? <Pill>مطلوب</Pill> : null}
    </span>
  );

  if (field.type === "textarea") {
    return (
      <label className="flex flex-col gap-1.5">
        {label}
        <textarea className={cn(inputClass, "min-h-28")} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
        {field.help ? <span className="text-xs text-fg-muted">{field.help.ar}</span> : null}
      </label>
    );
  }

  if (field.type === "select" || field.type === "radio") {
    const options = field.validation?.options ?? [];
    if (field.type === "radio") {
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">{field.label.ar}</legend>
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.id} checked={value === option.value} onChange={() => onChange(option.value)} />
              {option.label.ar}
            </label>
          ))}
        </fieldset>
      );
    }
    return (
      <label className="flex flex-col gap-1.5">
        {label}
        <select className={inputClass} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">اختر…</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label.ar}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">{field.label.ar}</legend>
        {(field.validation?.options ?? []).map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() =>
                onChange(selected.includes(option.value) ? selected.filter((item) => item !== option.value) : [...selected, option.value])
              }
            />
            {option.label.ar}
          </label>
        ))}
      </fieldset>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label.ar}
      </label>
    );
  }

  if (field.type === "range") {
    return (
      <label className="flex flex-col gap-1.5">
        {label}
        <input
          type="range"
          min={field.validation?.min ?? 0}
          max={field.validation?.max ?? 100}
          step={field.validation?.step ?? 1}
          value={Number(value || field.validation?.min || 0)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="text-xs text-fg-muted tabular-nums">{String(value || field.validation?.min || 0)}</span>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      {label}
      <input
        className={inputClass}
        type={field.type === "number" ? "number" : "text"}
        min={field.validation?.min}
        max={field.validation?.max}
        step={field.validation?.step}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
      />
      {field.help ? <span className="text-xs text-fg-muted">{field.help.ar}</span> : null}
    </label>
  );
}

function SchemaResult({ runtime, result, onRetry }: { runtime: LabRuntime; result: LabResult; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 rounded-panel border border-line bg-surface p-5 md:grid-cols-[auto_1fr] md:p-7">
        <div className="flex flex-col items-center justify-center gap-1 text-center md:min-w-44">
          <span className="text-[13px] font-semibold text-fg-muted">النتيجة الكلية</span>
          <span className="text-6xl leading-none font-bold tabular-nums">{result.scorecard.overall}</span>
          <span className="text-sm text-fg-muted">من 100</span>
          <span className="mt-1 rounded-full bg-accent px-3 py-1 text-sm font-bold text-on-accent">{result.scorecard.readiness}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="m-0 text-lg leading-8 font-bold">{result.scorecard.verdict}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.scorecard.dimensions.map((dimension) => (
              <div key={dimension.key} className="rounded-photo bg-surface-alt p-3">
                <div className="flex justify-between text-[13px]">
                  <span>{dimension.label}</span>
                  <span className="font-semibold tabular-nums">{dimension.score}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${dimension.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRetry}>أعد المحاولة</Button>
            <ButtonLink href="/labs" variant="ghost">
              كل المختبرات
            </ButtonLink>
          </div>
        </div>
      </section>
      <LabPanel title="ماذا جرّبت" subtitle={runtime.category_name}>
        <p className="m-0 text-sm leading-7 text-fg-muted">
          هذا المختبر مُعرّف من لوحة التحكم، ويعرض الحقول والمسار والأهداف كما ضبطها المسؤول.
        </p>
      </LabPanel>
    </div>
  );
}

function isEmpty(value: unknown): boolean {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}
