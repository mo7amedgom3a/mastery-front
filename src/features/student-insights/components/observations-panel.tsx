"use client";

import { CircleAlert, CircleCheck, Info, Lightbulb, Repeat } from "lucide-react";

import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

import type { HighlightTone } from "@/features/labs/model/types";
import type { LabInsights, Observation } from "../model/lab-insights";
import { PanelEmpty } from "./panel-states";

const MAX_OBSERVATIONS = 10;

const toneIcon: Record<HighlightTone, typeof Info> = { good: CircleCheck, bad: CircleAlert, info: Info };
const toneText: Record<HighlightTone, string> = { good: "text-green", bad: "text-pink", info: "text-sky" };
const toneLabel: Record<HighlightTone, string> = { good: "سلوك ناجح", bad: "نقطة تحتاج تصحيحًا", info: "ملاحظة" };

function ObservationRow({ observation }: { observation: Observation }) {
  const Icon = toneIcon[observation.tone];
  return (
    <li className="flex gap-3 rounded-photo border border-line bg-surface-alt/40 p-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", toneText[observation.tone])} aria-hidden />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="m-0 text-sm leading-6">{observation.text}</p>
        {observation.advice ? (
          <p className="m-0 flex items-start gap-1.5 rounded-chip bg-surface p-2 text-[13px] leading-5 text-fg-muted">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow" aria-hidden />
            <span>
              <strong className="font-semibold text-fg">البديل الأفضل: </strong>
              {observation.advice}
            </span>
          </p>
        ) : null}
        <p className="m-0 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
          <span className="font-semibold text-fg">{observation.labTitle}</span>
          <span aria-hidden>·</span>
          <span>{observation.moment}</span>
          <span aria-hidden>·</span>
          <span>{formatDateTime(observation.at)}</span>
          <span className="rounded-chip bg-surface px-1.5 py-0.5">{toneLabel[observation.tone]}</span>
        </p>
      </div>
    </li>
  );
}

/** The observer's voice: behavioural patterns distilled from the scorecards, then the moments behind them. */
export function ObservationsPanel({ insight }: { insight: LabInsights }) {
  const observations = insight.observations.slice(0, MAX_OBSERVATIONS);
  const { styles } = insight;

  return (
    <DashboardPanel
      id="insights-observations-title"
      title="ملاحظات المراقب على سلوكك"
      subtitle="لحظات مسجّلة داخل السيناريوهات، مع النمط السلوكي قبل المختبر وبعده."
    >
      {styles.pre || styles.post ? (
        <div className="flex flex-wrap items-start gap-2 rounded-photo border border-line bg-surface-alt p-3">
          <Repeat className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="m-0 text-sm font-bold">نمطك السلوكي</h3>
            <p className="m-0 text-[13px] leading-5 text-fg-muted">
              {styles.pre ? `قبل التجربة: ${styles.pre.label}` : "لا يوجد قياس قبلي"}
              {styles.post ? ` · بعد التجربة: ${styles.post.label}` : ""}
              {styles.changed ? " · تغيّر النمط بعد الممارسة، وهذا هدف المختبر." : ""}
            </p>
            <p className="m-0 text-[13px] leading-5 text-fg-muted">{styles.post?.text ?? styles.pre?.text}</p>
          </div>
        </div>
      ) : null}

      {insight.patterns.length ? (
        <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2" aria-label="أنماط سلوكية">
          {insight.patterns.slice(0, 4).map((pattern) => {
            const Icon = toneIcon[pattern.tone];
            return (
              <li key={pattern.id} className="flex gap-2 rounded-photo border border-line p-3">
                <Icon className={cn("mt-0.5 size-4 shrink-0", toneText[pattern.tone])} aria-hidden />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-bold">{pattern.title}</span>
                  <span className="text-[13px] leading-5 text-fg-muted">{pattern.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {observations.length ? (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {observations.map((observation) => (
            <ObservationRow key={observation.id} observation={observation} />
          ))}
        </ol>
      ) : (
        <PanelEmpty>لا توجد ملاحظات مسجّلة في هذه الفترة. كل مختبر جديد يضيف لحظات قابلة للمراجعة.</PanelEmpty>
      )}
    </DashboardPanel>
  );
}
