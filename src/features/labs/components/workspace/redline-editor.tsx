"use client";

import { PenLine } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { LabPanel, OptionCard } from "../bits";
import { DocumentViewer } from "../documents/document-viewer";
import { chosenOption, redlinableClauses, type DocSpec } from "../documents/doc-types";

/**
 * A generic redline step: the document on one side, the selected clause's wordings on the other.
 * `doc` is rebuilt by the caller from the redlines, so the page shows the chosen wording live.
 */
export function RedlineEditor({
  doc,
  fileName,
  gauge,
  cta,
  disabled,
  onChange,
  onDone,
}: {
  doc: (redlines: Readonly<Record<string, string>>) => DocSpec;
  fileName: string;
  /** Live meters for the current redlines (e.g. statement tone, minutes completeness). */
  gauge?: (redlines: Readonly<Record<string, string>>) => ReactNode;
  cta: string;
  disabled?: boolean;
  onChange?: (clauseId: string, optionId: string) => void;
  onDone: (redlines: Record<string, string>) => void;
}) {
  const [redlines, setRedlines] = useState<Record<string, string>>({});
  const spec = doc(redlines);
  const clauses = redlinableClauses(spec);
  const [active, setActive] = useState<string | null>(clauses[0]?.id ?? null);
  const clause = clauses.find((c) => c.id === active);
  const current = clause ? chosenOption(clause, redlines) : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <DocumentViewer doc={spec} fileName={fileName} redlines={redlines} activeClause={active} onClauseSelect={setActive} />
      <aside className="flex min-w-0 flex-col gap-4">
        {gauge?.(redlines)}
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <PenLine className="size-5 text-accent" aria-hidden /> {clause ? `${clause.number ?? ""} ${clause.title ?? ""}` : "اختر بندًا"}
            </span>
          }
          subtitle="البنود المظللة قابلة للتعديل. اضغط أي بند في المستند أو من القائمة."
        >
          {clause ? (
            <>
              {clause.issue ? <p className="m-0 rounded-photo bg-surface-alt px-3 py-2 text-[13px] leading-6">{clause.issue}</p> : null}
              <div role="radiogroup" aria-label="صياغة البند" className="flex flex-col gap-2">
                {(clause.options ?? []).map((option, index) => (
                  <OptionCard
                    key={option.id}
                    selected={current?.id === option.id}
                    onSelect={() => {
                      setRedlines((r) => ({ ...r, [clause.id]: option.id }));
                      onChange?.(clause.id, option.id);
                    }}
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
        <Button size="lg" block disabled={disabled} onClick={() => onDone(redlines)}>
          {cta}
        </Button>
      </aside>
    </div>
  );
}
