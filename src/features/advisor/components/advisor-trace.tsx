"use client";

import { clsx as cn } from "clsx";
import { Brain, Check, CircleHelp, Loader2, MessageCircleQuestion, Search, Signpost, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";

import { BidiText } from "@/components/content/bidi";

import { advisorCopy, traceCopy } from "../content/copy";
import type { TraceStep } from "../model/types";

/** The visible label of a step: what the agent is doing, in the visitor's words. */
export function traceLabel(step: TraceStep): string {
  if (step.kind === "thought") return traceCopy.thought;
  if (step.kind === "ask") return traceCopy.ask;
  if (step.kind === "tool") return traceCopy.tools[step.name] ?? traceCopy.agent;
  if (step.name === "understand" && step.status === "unknown") return traceCopy.understandUnknown;
  if (step.name === "route") return step.detail?.mode === "reasoning" ? traceCopy.routeDiagnose : traceCopy.routeDirect;
  return (traceCopy as unknown as Record<string, string>)[step.name] ?? step.name;
}

/** The short facts under a step: corrections, topic, result count, missing slots… */
function traceFacts(step: TraceStep): string[] {
  const facts: string[] = [];
  const detail = step.detail ?? {};
  if (step.kind === "tool") {
    if (step.query) facts.push(`«${step.query}»`);
    if (step.count !== undefined) facts.push(traceCopy.results(step.count));
    return facts;
  }
  if (detail.unknown_terms?.length) facts.push(`${traceCopy.unknownTerms}: ${detail.unknown_terms.map((term) => `«${term}»`).join("، ")}`);
  for (const [from, to] of Object.entries(detail.corrections ?? {})) facts.push(`${traceCopy.corrected} «${from}» ← ${to}`);
  if (detail.intent && traceCopy.intents[detail.intent]) facts.push(`${traceCopy.intent}: ${traceCopy.intents[detail.intent]}`);
  if (detail.topic) facts.push(`${traceCopy.topic}: ${detail.topic}`);
  else if (detail.goal) facts.push(`${traceCopy.goal}: ${detail.goal}`);
  if (step.name === "retrieval" && detail.count !== undefined) facts.push(traceCopy.results(detail.count));
  const filled = Object.keys(detail.filled ?? {});
  if (filled.length) facts.push(`${traceCopy.filled}: ${filled.map((slot) => traceCopy.slotNames[slot] ?? slot).join("، ")}`);
  if (detail.missing?.length) facts.push(`${traceCopy.missing}: ${detail.missing.map((slot) => traceCopy.slotNames[slot] ?? slot).join("، ")}`);
  return facts;
}

function StepIcon({ step }: { step: TraceStep }) {
  const className = "size-3.5 shrink-0";
  if (step.status === "running") return <Loader2 className={cn(className, "animate-spin motion-reduce:animate-none")} aria-hidden />;
  if (step.status === "unknown") return <CircleHelp className={className} aria-hidden />;
  if (step.kind === "thought") return <Brain className={className} aria-hidden />;
  if (step.kind === "ask") return <MessageCircleQuestion className={className} aria-hidden />;
  if (step.kind === "tool") return <Wrench className={className} aria-hidden />;
  if (step.name === "retrieval" || step.name === "matching") return <Search className={className} aria-hidden />;
  if (step.name === "understand") return <Sparkles className={className} aria-hidden />;
  if (step.name === "route") return <Signpost className={className} aria-hidden />;
  return <Check className={className} aria-hidden />;
}

/**
 * The agent's work for one answer: understanding the request, tool calls with their results and
 * its short thoughts. It is open while the answer streams and folds into one line when it is done
 * (the visitor can open it again).
 */
export function AdvisorTrace({ steps, running }: { steps: TraceStep[]; running: boolean }) {
  const [open, setOpen] = useState(running);
  const [wasRunning, setWasRunning] = useState(running);
  // Follow the run: open while it works, fold once the answer has landed.
  if (wasRunning !== running) {
    setWasRunning(running);
    setOpen(running);
  }
  if (!steps.length) return null;
  const title = running ? advisorCopy.traceTitleRunning : advisorCopy.traceTitleDone(steps.length);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="ma-advisor-trace self-start max-w-full rounded-chip border border-line bg-surface px-3 py-1.5 text-xs leading-6 text-fg-muted"
      data-testid="advisor-trace"
    >
      <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 font-medium select-none">
        {running ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
        <span>{title}</span>
      </summary>
      <ol className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0 pb-1" aria-live="polite">
        {steps.map((step) => {
          const facts = traceFacts(step);
          return (
            <li key={step.id} data-step={step.kind === "step" ? step.name : step.kind} data-status={step.status} className="flex items-start gap-1.5">
              <span className="mt-1.5"><StepIcon step={step} /></span>
              <span className="min-w-0">
                <span className={cn("font-medium", step.status === "running" ? "text-fg" : undefined)}>{traceLabel(step)}</span>
                {step.text ? (
                  <>
                    {" — "}
                    <BidiText text={step.text} />
                  </>
                ) : null}
                {facts.length ? (
                  <span className="block">
                    <BidiText text={facts.join(" · ")} />
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
