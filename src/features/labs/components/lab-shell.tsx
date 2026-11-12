"use client";

import { ArrowRight, Timer } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import { clock } from "../model/scoring";
import type { LabDefinition } from "../model/types";
import { valueDir } from "./bits";

/** The lab frame: back link, title, phase stepper, elapsed timer and an objectives HUD. */
export function LabShell({
  lab,
  step,
  hud,
  children,
}: {
  lab: LabDefinition;
  /** 0 = briefing, 1..n = lab phases, n+1 = debrief. */
  step: number;
  hud?: ReactNode;
  children: ReactNode;
}) {
  const steps = ["الإحاطة", ...lab.phases, "التقييم"];
  const running = step > 0 && step < steps.length - 1;
  const [seconds, setSeconds] = useState(0);

  // A new phase replaces the working area: bring its top into view.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="ma-container flex flex-col gap-6 py-8 md:py-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppLink href={routes.labs} className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <ArrowRight className="size-4" aria-hidden />
            كل المختبرات
          </AppLink>
          <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted tabular-nums" aria-label="الوقت المنقضي">
            <Timer className="size-4" aria-hidden />
            {clock(seconds)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="m-0 text-[13px] font-semibold text-fg-muted">
            {lab.categoryName} · مختبر عملي
          </p>
          <h1 className="m-0 text-2xl leading-[1.4] font-bold md:text-3xl">{lab.title}</h1>
        </div>
        <ol className="m-0 flex list-none gap-1.5 overflow-x-auto p-0 pb-1" aria-label="مراحل المختبر">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[13px] leading-5",
                index === step
                  ? "border-accent bg-accent font-semibold text-on-accent"
                  : index < step
                    ? "border-line bg-surface-alt text-fg"
                    : "border-line text-fg-muted",
              )}
            >
              <span className="tabular-nums">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </header>
      {hud ? <div className="z-10 md:sticky md:top-[calc(var(--header-h)+8px)]">{hud}</div> : null}
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  );
}

/** Compact objectives strip shown above the working area. */
export function ObjectivesHud({ items }: { items: { label: string; value: ReactNode; done?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-panel border border-line bg-surface/95 p-3 backdrop-blur">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-photo border px-3 py-1.5 text-[13px] leading-5",
            item.done ? "border-green text-fg" : "border-line text-fg-muted",
          )}
        >
          <span>{item.label}</span>
          <span dir={valueDir(item.value)} className="font-bold text-fg tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
