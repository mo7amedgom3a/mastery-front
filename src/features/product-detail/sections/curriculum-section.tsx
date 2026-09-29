import { ChevronDown, PlayCircle } from "lucide-react";

import { formatCount } from "@/lib/format";

import type { UnitVM } from "../model/types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };

/** Units as native disclosures (no JS, every lesson title is in the HTML). The first unit starts open. */
export function CurriculumSection({ units, title }: { units: readonly UnitVM[]; title: string }) {
  if (units.length === 0) {
    return null;
  }
  return (
    <section
      id="curriculum"
      aria-labelledby="curriculum-title"
      className="scroll-mt-[calc(var(--header-h)+4.5rem)]"
    >
      <h2 id="curriculum-title" className="m-0 text-2xl font-bold">
        {title}
      </h2>
      <ol className="m-0 mt-6 list-none border-t border-line-strong p-0">
        {units.map((unit, index) => (
          <li key={unit.id} className="border-b border-line">
            <details open={index === 0} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-alt text-sm font-bold tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-bold text-pretty">{unit.title}</span>
                  <span className="text-sm text-fg-muted">
                    {[unit.lessons.length > 0 ? formatCount(unit.lessons.length, LESSON_FORMS) : null, unit.duration]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-fg-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              {unit.summary ? <p className="m-0 max-w-[68ch] pb-3 ps-13 text-sm text-fg-muted">{unit.summary}</p> : null}
              {unit.lessons.length > 0 ? (
                <ol className="m-0 list-none pb-4 ps-13 pe-0">
                  {unit.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex min-h-11 items-center gap-3 text-[15px]">
                      <PlayCircle aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
                      <span className="min-w-0 flex-1 text-pretty">{lesson.title}</span>
                      {lesson.free ? <span className="ma-tag ma-tag--green">مجاني</span> : null}
                      {lesson.duration ? (
                        <span dir="ltr" className="shrink-0 text-sm tabular-nums text-fg-muted">
                          {lesson.duration}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
