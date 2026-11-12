"use client";

import { SearchCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { RootCause } from "../../content/deals/types";
import { LabPanel, OptionCard } from "../bits";

const MAX = 3;

/** Tag the real reasons the deal stalled, from the evidence in the deal file. */
export function RootCausePicker({
  causes,
  onDone,
  title = "لماذا تعثرت الصفقة؟",
  subtitle = `افتح عناصر السجل واقرأ الأدلة، ثم اختر حتى ${MAX} أسباب حقيقية. الافتراضات الخاطئة تُحسب عليك.`,
  cta = "ابدأ مكالمة الاستعادة",
}: {
  causes: readonly RootCause[];
  onDone: (ids: string[]) => void;
  title?: string;
  subtitle?: string;
  cta?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : current.length < MAX ? [...current, id] : current));

  return (
    <LabPanel
      title={
        <span className="inline-flex items-center gap-2">
          <SearchCheck className="size-5 text-pink" aria-hidden /> {title}
        </span>
      }
      subtitle={subtitle}
    >
      <div className="flex flex-col gap-2">
        {causes.map((cause) => (
          <OptionCard
            key={cause.id}
            multi
            selected={picked.includes(cause.id)}
            disabled={!picked.includes(cause.id) && picked.length >= MAX}
            onSelect={() => toggle(cause.id)}
            title={cause.label}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span dir="ltr" className="text-[13px] text-fg-muted tabular-nums">
          {picked.length} / {MAX}
        </span>
        <Button disabled={picked.length < 2} onClick={() => onDone(picked)}>
          {cta}
        </Button>
      </div>
    </LabPanel>
  );
}
