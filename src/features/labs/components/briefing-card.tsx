import { Clock, Gauge, Target, TriangleAlert, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import type { LabDefinition } from "../model/types";
import { skillLabels } from "../model/types";
import { Pill } from "./bits";
import { LabPrepList } from "./lab-recommendations";

/** Scenario, role, targets and constraints, then the start button. */
export function BriefingCard({ lab, onStart, extra }: { lab: LabDefinition; onStart: () => void; extra?: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 md:p-7">
        <div className={cn("flex flex-col gap-2 rounded-photo p-4 text-ink", brandBg[lab.color])}>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <UserRound className="size-4" aria-hidden />
            دورك
          </span>
          <p className="m-0 text-lg leading-8 font-bold">{lab.role}</p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-lg font-bold">السيناريو</h2>
          <p className="m-0 leading-8 text-fg-muted">{lab.scenario}</p>
        </div>
        {extra}
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            <Clock className="size-3.5" aria-hidden /> {lab.minutes} دقيقة تقريبًا
          </Pill>
          <Pill>
            <Gauge className="size-3.5" aria-hidden /> {lab.difficulty}
          </Pill>
          {lab.skills.map((skill) => (
            <Pill key={skill}>{skillLabels[skill]}</Pill>
          ))}
        </div>
      </section>
      <aside className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 md:p-7">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 inline-flex items-center gap-2 text-lg font-bold">
            <Target className="size-5 text-accent" aria-hidden /> الأهداف
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {lab.targets.map((target) => (
              <li key={target} className="rounded-photo border border-line px-3 py-2 text-sm leading-6">
                {target}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="m-0 inline-flex items-center gap-2 text-lg font-bold">
            <TriangleAlert className="size-5 text-yellow" aria-hidden /> القيود
          </h2>
          <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6 text-fg-muted">
            {lab.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>
        <LabPrepList lab={lab} />
        <p className="m-0 rounded-photo bg-surface-alt p-3 text-[13px] leading-6 text-fg-muted">
          تبدأ باختبار قصير من 5 أسئلة يرسم نمط سلوكك، ثم تدخل المحاكاة. في النهاية تحصل على تقييم مفصّل ونقاط خبرة. الأخطاء هنا آمنة، فجرّب.
        </p>
        <Button size="lg" block onClick={onStart}>
          ابدأ المختبر
        </Button>
      </aside>
    </div>
  );
}
