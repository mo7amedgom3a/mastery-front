"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import type { Persona } from "../model/dialogue";
import { LabPanel } from "./bits";

export type ChatTone = "good" | "bad" | "info";

export type ChatEntry = {
  id: string;
  who: "learner" | "persona" | "coach";
  text: string;
  /** Simulated clock label, e.g. "00:24". */
  at?: string;
  tone?: ChatTone;
};

const coachIcon = { good: CircleCheck, bad: CircleAlert, info: Info };
const coachTone = { good: "text-green", bad: "text-pink", info: "text-sky" };

/**
 * The two-person chat surface shared by the objection labs: persona header, bubbles, a typing beat
 * and the learner's choices underneath. Mirrors `PersonaChat` so every lab feels the same.
 */
/** A chat reply button, matching the plain choices of the sales-call lab. */
export function ChatChoice({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-photo border p-3 text-start text-sm leading-7 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-accent bg-accent/10 font-semibold"
          : "border-line bg-surface hover:border-accent hover:bg-accent/5",
      )}
    >
      {children}
    </button>
  );
}

export function ChatFrame({
  title,
  subtitle,
  persona,
  entries,
  typing = false,
  children,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  persona: Persona;
  entries: readonly ChatEntry[];
  typing?: boolean;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [entries.length, typing]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <LabPanel title={title} subtitle={subtitle}>
        <ol
          ref={listRef}
          aria-live="polite"
          className="m-0 flex h-[min(52vh,520px)] list-none flex-col gap-3 overflow-y-auto rounded-photo border border-line bg-surface-alt/30 p-3 md:p-4"
        >
          {entries.map((entry) => {
            if (entry.who === "coach") {
              const Icon = coachIcon[entry.tone ?? "info"];
              return (
                <li key={entry.id} className="flex justify-center">
                  <span className="inline-flex max-w-[90%] items-start gap-1.5 rounded-chip bg-surface px-3 py-1 text-[12px] leading-5 text-fg-muted">
                    <Icon className={cn("mt-0.5 size-3.5 shrink-0", coachTone[entry.tone ?? "info"])} aria-hidden />
                    {entry.text}
                  </span>
                </li>
              );
            }
            const learner = entry.who === "learner";
            return (
              <li key={entry.id} className={cn("flex items-end gap-2", learner ? "flex-row-reverse" : "flex-row")}>
                {learner ? null : (
                  <span
                    aria-hidden
                    className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink", brandBg[persona.tone])}
                  >
                    {persona.initials}
                  </span>
                )}
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-1 rounded-panel px-4 py-2.5 text-sm leading-7",
                    learner ? "rounded-ee-sm bg-accent text-on-accent" : "rounded-es-sm border border-line bg-surface",
                  )}
                >
                  <span className={cn("text-[11px] font-semibold", learner ? "opacity-80" : "text-fg-muted")}>
                    {learner ? "أنت" : persona.name}
                    {entry.at ? ` · ${entry.at}` : ""}
                  </span>
                  <span>{entry.text}</span>
                </div>
              </li>
            );
          })}
          {typing ? (
            <li className="flex items-center gap-2 text-[13px] text-fg-muted" aria-label={`${persona.name} يكتب`}>
              <span
                aria-hidden
                className={cn("flex size-9 items-center justify-center rounded-full text-[12px] font-bold text-ink", brandBg[persona.tone])}
              >
                {persona.initials}
              </span>
              <span className="inline-flex gap-1 rounded-full border border-line bg-surface px-3 py-2">
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-fg-muted" />
              </span>
            </li>
          ) : null}
        </ol>
        {children}
      </LabPanel>
      {aside ? <aside className="flex min-w-0 flex-col gap-4">{aside}</aside> : null}
    </div>
  );
}
