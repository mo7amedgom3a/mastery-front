"use client";

import { BookMarked, ExternalLink, ShieldAlert } from "lucide-react";

import { labSources, sources, SOURCES_CHECKED } from "../../content/nuqta/sources";
import type { JourneySlug } from "../../model/types";

/** «المراجع»: the training-simulation disclaimer plus the public sources a journey lab relies on. */
export function SourcesPanel({ slug }: { slug: JourneySlug }) {
  const items = labSources[slug].map((id) => sources[id]).filter(Boolean);
  return (
    <details className="group rounded-panel border border-line bg-surface p-4 md:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold">
        <span className="inline-flex items-center gap-2">
          <BookMarked className="size-4 text-accent" aria-hidden /> المراجع وإخلاء المسؤولية
        </span>
        <span className="text-[12px] font-normal text-fg-muted group-open:hidden">عرض</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="m-0 inline-flex items-start gap-2 rounded-photo bg-surface-alt px-3 py-2 text-[13px] leading-6">
          <ShieldAlert className="mt-1 size-4 shrink-0 text-yellow" aria-hidden />
          محاكاة تدريبية بشركة وأشخاص وأرقام افتراضية. الإجراءات والرسوم والنسب مبسّطة وقد تتغير؛ راجع الجهة الرسمية أو مستشارًا مرخصًا
          قبل أي قرار فعلي. آخر مراجعة للمصادر: {SOURCES_CHECKED}.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((source) => (
            <li key={source.id} className="flex flex-col gap-0.5 rounded-photo border border-line px-3 py-2">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg hover:underline"
              >
                {source.title}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
              <span className="text-[12px] leading-5 text-fg-muted">{source.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
