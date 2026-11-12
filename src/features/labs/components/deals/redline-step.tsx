"use client";

import { PenLine, Scale } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { ACCEPTANCE_TARGET, MARGIN_FLOOR } from "../../content/deals/score";
import type { DealScenario } from "../../content/deals/types";
import { LabPanel, MeterBar, OptionCard } from "../bits";
import { DocumentViewer } from "../documents/document-viewer";
import { chosenOption, redlinableClauses, redlineTotals, sar } from "../documents/doc-types";

/** Live acceptance / margin / value gauge for a redlined document. */
export function DealGauge({ scenario, redlines }: { scenario: DealScenario; redlines: Readonly<Record<string, string>> }) {
  const totals = redlineTotals(scenario.document, redlines, scenario.base);
  const accepted = totals.acceptance >= ACCEPTANCE_TARGET;
  const healthy = totals.margin >= MARGIN_FLOOR;
  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Scale className="size-5 text-accent" aria-hidden /> ميزان الصفقة
        </span>
      }
      subtitle={`هدفك: قبول ${ACCEPTANCE_TARGET}٪ على الأقل مع هامش لا يقل عن ${MARGIN_FLOOR}٪`}
    >
      <MeterBar label="قبول العميل" value={totals.acceptance} />
      <MeterBar label="هامش الشركة والمخاطرة" value={totals.margin} />
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-fg-muted">قيمة الصفقة بعد التعديل</span>
        <span dir="ltr" className="font-bold tabular-nums">
          {sar(totals.value)}
        </span>
      </div>
      <p
        className={cn(
          "m-0 rounded-photo px-3 py-2 text-[13px] leading-6 font-semibold text-ink",
          accepted && healthy ? "bg-green" : accepted ? "bg-yellow" : "bg-surface-alt text-fg",
        )}
      >
        {accepted && healthy
          ? "عرض متوازن: العميل سيقبل والشركة رابحة."
          : accepted
            ? "العميل سيقبل، لكنك تنازلت عن هامش كبير."
            : "العميل لن يقبل بعد: البنود التي تمس ألمه لم تُعالج."}
      </p>
    </LabPanel>
  );
}

/** Phase: redline the contract / proposal in the PDF-style viewer. */
export function RedlineStep({ scenario, onDone }: { scenario: DealScenario; onDone: (redlines: Record<string, string>) => void }) {
  const clauses = redlinableClauses(scenario.document);
  const [redlines, setRedlines] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(clauses[0]?.id ?? null);
  const clause = clauses.find((c) => c.id === active);
  const current = clause ? chosenOption(clause, redlines) : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <DocumentViewer
        doc={scenario.document}
        fileName={scenario.fileName}
        redlines={redlines}
        activeClause={active}
        onClauseSelect={setActive}
      />
      <aside className="flex min-w-0 flex-col gap-4">
        <DealGauge scenario={scenario} redlines={redlines} />
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <PenLine className="size-5 text-accent" aria-hidden /> {clause ? `${clause.number ?? ""} ${clause.title ?? ""}` : "اختر بندًا"}
            </span>
          }
          subtitle="البنود المظللة بالأصفر قابلة للتعديل. اضغط أي بند في المستند."
        >
          {clause ? (
            <>
              {clause.issue ? <p className="m-0 rounded-photo bg-surface-alt px-3 py-2 text-[13px] leading-6">{clause.issue}</p> : null}
              <div role="radiogroup" aria-label="صياغة البند" className="flex flex-col gap-2">
                {(clause.options ?? []).map((option, index) => (
                  <OptionCard
                    key={option.id}
                    selected={current?.id === option.id}
                    onSelect={() => setRedlines((r) => ({ ...r, [clause.id]: option.id }))}
                    title={option.label}
                    detail={index === 0 ? "الصياغة الحالية دون تغيير" : option.text}
                  />
                ))}
              </div>
            </>
          ) : null}
          <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="البنود">
            {clauses.map((c) => {
              const changed = chosenOption(c, redlines) !== c.options?.[0];
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "rounded-chip border px-2.5 py-1 text-[12px] font-semibold",
                      c.id === active ? "border-accent bg-accent text-on-accent" : changed ? "border-green bg-green/15" : "border-line",
                    )}
                  >
                    {c.title}
                  </button>
                </li>
              );
            })}
          </ol>
        </LabPanel>
        <Button size="lg" block onClick={() => onDone(redlines)}>
          اعتمد العرض المعدّل
        </Button>
      </aside>
    </div>
  );
}
