"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useLabSession, type LabField, type LabPersona, type LiveBlock, type LiveBlockDocument, type LiveBlockPage, type LiveLabRuntime } from "../../api";
import { evaluateConditions } from "../../model/conditions";
import { buildScorecard } from "../../model/scoring";
import type { Dimension, LabResult } from "../../model/types";
import { LabPanel } from "../bits";
import { LabShell } from "../lab-shell";
import { SchemaField } from "../schema/schema-lab";

type Values = Record<string, unknown>;
type Choices = Record<string, string>;

function documentOf(runtime: LiveLabRuntime): LiveBlockDocument {
  return (runtime.scenario?.content ?? { pages: [] }) as unknown as LiveBlockDocument;
}

function localized(value: unknown, locale = "ar"): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record[locale];
    if (typeof preferred === "string" && preferred.trim()) return preferred;
    if (typeof record.ar === "string") return record.ar;
  }
  return "";
}

function defaultsOf(fields: LabField[]): Values {
  return Object.fromEntries(
    fields.map((field) => [
      field.id,
      field.default ?? (field.type === "checkbox" ? false : field.type === "multiselect" ? [] : ""),
    ]),
  );
}

function nextPage(document: LiveBlockDocument, page: LiveBlockPage): LiveBlockPage | null {
  if (page.next_page) return document.pages.find((candidate) => candidate.id === page.next_page) ?? null;
  const index = document.pages.findIndex((candidate) => candidate.id === page.id);
  return index >= 0 ? document.pages[index + 1] ?? null : null;
}

/**
 * Generic runner for `blocks` labs: the backend owns the pages and typed blocks.
 *
 * `studio` renders an unsaved draft inside the admin's builder (`/preview/lab`): it opens on the
 * requested stage, never calls the labs API, and scores the finish locally.
 */
export function BlocksLab({
  runtime,
  preview = false,
  studio,
}: {
  runtime: LiveLabRuntime;
  preview?: boolean;
  studio?: { pageId?: string | null };
}) {
  const document = useMemo(() => documentOf(runtime), [runtime]);
  const fields = document.fields ?? [];
  const offline = Boolean(studio);
  const [pageId, setPageId] = useState(
    (studio?.pageId && document.pages.some((candidate) => candidate.id === studio.pageId) ? studio.pageId : null) ??
      document.pages[0]?.id ??
      "",
  );
  const [values, setValues] = useState<Values>(() => defaultsOf(fields));
  const [choices, setChoices] = useState<Choices>({});
  const [result, setResult] = useState<LabResult | null>(null);
  const [busy, setBusy] = useState(false);
  const session = useLabSession(runtime.card.slug, { preview, source: preview ? "admin-preview" : "blocks-lab" });

  // Record the run server-side as soon as the learner opens it; actions are queued safely.
  useEffect(() => {
    if (!offline) void session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const record: typeof session.send = (action) => (offline ? Promise.resolve() : session.send(action));

  const page = document.pages.find((candidate) => candidate.id === pageId) ?? document.pages[0];
  const firstPage = document.pages[0];
  // The shell's first chip is the briefing and its last is the debrief; keep those pages out of the
  // middle phase labels so the trail never repeats "الإحاطة"/"التقييم".
  const trail = document.pages.filter(
    (candidate) =>
      candidate.show_in_trail !== false &&
      candidate.id !== firstPage?.id &&
      !candidate.blocks.some((block) => block.type === "scorecard"),
  );
  const onDebrief = Boolean(page?.blocks.some((block) => block.type === "scorecard"));
  const step = result || onDebrief ? trail.length + 1 : page?.id === firstPage?.id ? 0 : trail.findIndex((candidate) => candidate.id === page?.id) + 1;
  const context = { field: values, choice: choices };
  const visible = (block: LiveBlock) => !block.admin_only && evaluateConditions(block.visible_when, context);

  const finish = async () => {
    setBusy(true);
    const dimensions: Dimension[] = runtime.definition.scoring.dimensions.map((dimension) => ({
      key: dimension.key,
      label: dimension.label.ar,
      score: 60,
      weight: dimension.weight,
      skill: dimension.skill,
      praise: "أكملت المحاولة.",
      tip: "جرّب المحاولة مرة أخرى لتحسين القرار.",
    }));
    const fallback = (): LabResult => ({
      scorecard: buildScorecard({ dimensions, highlights: [], verdict: "أكملت المختبر." }),
      xp: 0,
      newBadges: [],
      pre: null,
      post: null,
    });
    const completed = offline
      ? fallback()
      : await session.complete(
          { engine: "blocks", answers: { fields: values, choices }, pre: null, post: null, elapsed_seconds: 0 },
          fallback,
        );
    setResult(completed);
    setBusy(false);
  };

  const go = (target: LiveBlockPage | null) => {
    if (!target) {
      void finish();
      return;
    }
    setPageId(target.id);
    void record({ type: "page.enter", page_id: target.id });
  };

  if (!document.pages.length) {
    return (
      <LabPanel title="هذا المختبر فارغ">
        <p className="m-0 text-sm leading-7 text-fg-muted">لم تُضف صفحات بعد في ورشة العمل.</p>
      </LabPanel>
    );
  }

  return (
    <LabShell
      lab={{
        title: runtime.card.title,
        categoryName: runtime.card.category_name ?? "",
        phases: trail.map((candidate) => localized(candidate.title) || candidate.id),
      }}
      step={step}
    >
      {session.error ? (
        <div role="alert" className="rounded-panel border border-pink/50 bg-pink/10 p-4 text-sm leading-7 text-fg">
          {session.error}
        </div>
      ) : null}

      {page ? (
        <div className="flex flex-col gap-6">
          {page.title ? <h2 className="m-0 text-xl leading-8 font-bold">{localized(page.title)}</h2> : null}
          {page.id === firstPage?.id && document.intro ? <p className="m-0 text-sm leading-7 text-fg-muted">{document.intro}</p> : null}
          {page.blocks.filter(visible).map((block) => (
            <BlockView
              key={block.id}
              block={block}
              fields={fields}
              personas={document.personas ?? []}
              values={values}
              choices={choices}
              result={result}
              busy={busy}
              onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
              onForm={(block) => {
                const target = block.props.next_page
                  ? document.pages.find((candidate) => candidate.id === String(block.props.next_page)) ?? null
                  : nextPage(document, page);
                void record({
                  type: "form.submit",
                  phase_id: page.id,
                  block_id: block.id,
                  values,
                  next_page: target?.id,
                });
                go(target);
              }}
              onChoose={(block, choiceId) => {
                const options = (block.props.options ?? []) as { id: string; next_page?: string }[];
                const option = options.find((candidate) => candidate.id === choiceId);
                const target = option?.next_page
                  ? document.pages.find((candidate) => candidate.id === option.next_page) ?? null
                  : nextPage(document, page);
                setChoices((current) => ({ ...current, [block.id]: choiceId }));
                void record({
                  type: "choice.select",
                  block_id: block.id,
                  choice_id: choiceId,
                  next_page: target?.id,
                });
                go(target);
              }}
              onFinish={() => void finish()}
            />
          ))}

          {!page.blocks.some((block) => visible(block) && (block.type === "choice" || block.type === "dialogue" || block.type === "form")) && !result ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={() => (nextPage(document, page) ? go(nextPage(document, page)) : void finish())} disabled={busy}>
                {nextPage(document, page) ? "متابعة" : busy ? "جارٍ التقييم…" : "اعرض تقييمي"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </LabShell>
  );
}

function BlockView({
  block,
  fields,
  personas,
  values,
  choices,
  result,
  busy,
  onChange,
  onForm,
  onChoose,
  onFinish,
}: {
  block: LiveBlock;
  fields: LabField[];
  personas: LabPersona[];
  values: Values;
  choices: Choices;
  result: LabResult | null;
  busy: boolean;
  onChange: (id: string, value: unknown) => void;
  onForm: (block: LiveBlock) => void;
  onChoose: (block: LiveBlock, choiceId: string) => void;
  onFinish: () => void;
}) {
  const props = block.props ?? {};
  switch (block.type) {
    case "heading": {
      const level = Number(props.level ?? 2);
      const className = level >= 4 ? "text-base" : level === 3 ? "text-lg" : "text-xl";
      return <h3 className={cn("m-0 leading-8 font-bold", className)}>{localized(props.text)}</h3>;
    }
    case "rich_text":
      return <Markdownish value={String(props.markdown ?? "")} />;
    case "callout": {
      const tone = String(props.tone ?? "info");
      const style = {
        info: "border-sky/40 bg-sky/10",
        success: "border-mint/50 bg-mint/10",
        warning: "border-amber/50 bg-amber/10",
        danger: "border-pink/50 bg-pink/10",
      }[tone] ?? "border-line bg-surface-alt";
      return (
        <div className={cn("rounded-panel border p-4 text-fg", style)}>
          {localized(props.title) ? <strong className="block text-sm">{localized(props.title)}</strong> : null}
          <p className="m-0 text-sm leading-7">{localized(props.text)}</p>
        </div>
      );
    }
    case "checklist": {
      const items = (props.items ?? []) as { id: string; text: unknown; done?: boolean }[];
      return (
        <LabPanel title={localized(props.title) || "قائمة"}>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm leading-6">
                <span aria-hidden className="mt-1 inline-grid size-4 place-items-center rounded border border-line text-[10px]">{item.done ? "✓" : ""}</span>
                <span>{localized(item.text)}</span>
              </li>
            ))}
          </ul>
        </LabPanel>
      );
    }
    case "kpi":
      return (
        <div className="rounded-panel border border-line bg-surface p-4 text-fg">
          <span className="text-xs text-fg-muted">{localized(props.label)}</span>
          <strong className="block text-2xl leading-9">{localized(props.value)}</strong>
          {localized(props.hint) ? <span className="text-xs text-fg-muted">{localized(props.hint)}</span> : null}
        </div>
      );
    case "table": {
      const columns = (props.columns ?? []) as unknown[];
      const rows = (props.rows ?? []) as unknown[][];
      return (
        <div className="overflow-x-auto text-fg">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="border-b border-line px-3 py-2 text-start font-semibold">{localized(column)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b border-line px-3 py-2">{localized(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "image":
      return (
        <figure className="m-0">
          {props.url ? <img src={String(props.url)} alt={String(props.alt ?? "")} className="w-full rounded-panel border border-line" /> : null}
          {localized(props.caption) ? <figcaption className="mt-1 text-xs text-fg-muted">{localized(props.caption)}</figcaption> : null}
        </figure>
      );
    case "divider":
      return <hr className="m-0 border-0 border-t border-line" />;
    case "form": {
      const ids = (props.field_ids ?? []) as string[];
      const selected = ids
        .map((id) => fields.find((field) => field.id === id))
        .filter((field): field is LabField => Boolean(field))
        .filter((field) => !field.visible_when?.length || evaluateConditions(field.visible_when, { field: values }));
      const missing = selected.filter((field) => field.required && (values[field.id] === "" || values[field.id] == null));
      return (
        <LabPanel title={localized(props.title) || "نموذج"} subtitle="املأ الحقول ثم تابع.">
          <div className="flex flex-col gap-5">
            {selected.map((field) => (
              <SchemaField key={field.id} field={field} value={values[field.id]} onChange={(value) => onChange(field.id, value)} />
            ))}
            <Button block disabled={missing.length > 0} onClick={() => onForm(block)}>
              {String(props.submit_label ?? "متابعة")}
            </Button>
          </div>
        </LabPanel>
      );
    }
    case "chat": {
      const persona = props.persona_id ? personas.find((item) => item.id === props.persona_id) : undefined;
      const messages = (props.messages ?? []) as { id: string; from: "persona" | "learner"; text: unknown }[];
      const options = (props.options ?? []) as { id: string; label: unknown }[];
      const picked = choices[block.id];
      const pickedLabel = options.find((option) => option.id === picked)?.label;
      return (
        <LabPanel
          title={localized(props.title) || (persona ? `${persona.name} · ${persona.role}` : "محادثة")}
          subtitle="اقرأ الرسائل واختر ردّك."
        >
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-panel border px-3 py-2 text-sm leading-6",
                  message.from === "learner"
                    ? "self-end border-accent/40 bg-accent/10"
                    : "self-start border-line bg-surface-alt",
                )}
              >
                {localized(message.text)}
              </div>
            ))}
            {pickedLabel ? (
              <div className="max-w-[85%] self-end rounded-panel border border-accent/40 bg-accent/10 px-3 py-2 text-sm leading-6">
                {localized(pickedLabel)}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(picked)}
                onClick={() => onChoose(block, option.id)}
                className={cn(
                  "rounded-photo border border-line p-3 text-start text-sm leading-6 transition-colors hover:border-accent",
                  picked === option.id ? "border-accent bg-accent/10" : "",
                )}
              >
                {localized(option.label)}
              </button>
            ))}
          </div>
        </LabPanel>
      );
    }
    case "choice":
    case "dialogue": {
      const persona = props.persona_id ? personas.find((item) => item.id === props.persona_id) : undefined;
      const options = (props.options ?? []) as { id: string; label: unknown }[];
      return (
        <LabPanel title={block.type === "dialogue" && persona ? `${persona.name} · ${persona.role}` : "قرار"} subtitle={localized(props.prompt)}>
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(choices[block.id])}
                onClick={() => onChoose(block, option.id)}
                className={cn(
                  "rounded-photo border border-line p-3 text-start text-sm leading-6 transition-colors hover:border-accent",
                  choices[block.id] === option.id ? "border-accent bg-accent/10" : "",
                )}
              >
                {localized(option.label)}
              </button>
            ))}
          </div>
        </LabPanel>
      );
    }
    case "scorecard":
      return result ? <ScoreResultView result={result} title={localized(props.title) || "تقييمك"} /> : (
        <LabPanel title={localized(props.title) || "تقييمك"}>
          <p className="m-0 text-sm leading-7 text-fg-muted">أكمل الصفحة الأخيرة لعرض بطاقة النتيجة.</p>
          <Button block disabled={busy} onClick={onFinish}>{busy ? "جارٍ التقييم…" : "اعرض تقييمي"}</Button>
        </LabPanel>
      );
    case "engine_widget":
      return (
        <LabPanel title="محرّك مخصص">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            هذا البلوك مخصّص لمحرّك قديم ({String(props.engine_key ?? "—")}) ولم يُربط بعد. شغّل المختبر من صفحته الأصلية حتى يُنقل المحرّك.
          </p>
        </LabPanel>
      );
    default:
      return (
        <div className="rounded-panel border border-dashed border-line p-4 text-sm text-fg-muted">
          نوع بلوك غير معروف: {block.type}
        </div>
      );
  }
}

function Markdownish({ value }: { value: string }) {
  const paragraphs = value.split(/\n{2,}/).filter((part) => part.trim());
  if (!paragraphs.length) return null;
  return (
    <div className="flex flex-col gap-3 text-sm leading-7">
      {paragraphs.map((part, index) => (
        <p key={index} className="m-0">
          {part.split("\n").map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex ? <br /> : null}
              {line.replace(/^\s*[-*]\s+/, "• ")}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function ScoreResultView({ result, title }: { result: LabResult; title: string }) {
  return (
    <LabPanel title={title} subtitle={result.scorecard.verdict}>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
        <div className="rounded-panel border border-line bg-surface-alt p-4 text-center">
          <strong className="block text-4xl leading-tight">{result.scorecard.overall}</strong>
          <span className="text-xs text-fg-muted">{result.scorecard.readiness}</span>
        </div>
        <div className="flex flex-col gap-3">
          {result.scorecard.dimensions.map((dimension) => (
            <div key={dimension.key}>
              <div className="flex items-center justify-between text-sm">
                <span>{dimension.label}</span>
                <span className="tabular-nums">{dimension.score}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-accent" style={{ width: `${dimension.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LabPanel>
  );
}
