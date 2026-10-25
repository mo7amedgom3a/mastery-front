"use client";

import { CheckCircle2, ScrollText } from "lucide-react";
import { useEffect, useRef } from "react";

import { toTextBlocks } from "@/lib/format";

export type PolicySection = { id: number; title: string | null; body_html: string | null };

/**
 * The programme policy in a scroll box. `onRead` fires once the end of the text has been scrolled
 * into view, so the agreement can only be given after reading it. The legacy HTML is rendered as
 * plain text blocks, never as raw HTML.
 */
export function PolicyReader({ sections, read, onRead }: { sections: PolicySection[]; read: boolean; onRead: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const end = endRef.current;
    if (!box || !end || read) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onRead();
      },
      { root: box, threshold: 1 },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [read, onRead]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="policy-title" className="m-0 flex items-center gap-2 text-base font-bold">
          <ScrollText aria-hidden="true" className="size-5 text-accent" />
          سياسة برنامج التسويق بالعمولة
        </h3>
        {read ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green" role="status">
            <CheckCircle2 aria-hidden="true" className="size-4" /> تمت القراءة
          </span>
        ) : (
          <span className="text-xs text-fg-muted">اقرأ السياسة حتى النهاية</span>
        )}
      </div>
      <div
        ref={boxRef}
        tabIndex={0}
        role="region"
        aria-labelledby="policy-title"
        className="max-h-80 overflow-y-auto rounded-ctl border border-line bg-surface-alt/40 p-4 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {sections.map((section) => (
          <section key={section.id} className="mb-5 last:mb-0">
            {section.title ? <h4 className="m-0 mb-2 text-sm font-bold text-fg">{section.title}</h4> : null}
            {toTextBlocks(section.body_html).map((block, index) =>
              block.type === "p" ? (
                <p key={index} className="m-0 mb-2 text-fg-muted">{block.text}</p>
              ) : block.ordered ? (
                <ol key={index} className="m-0 mb-2 list-decimal ps-5 text-fg-muted">
                  {block.items.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              ) : (
                <ul key={index} className="m-0 mb-2 list-disc ps-5 text-fg-muted">
                  {block.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ),
            )}
          </section>
        ))}
        <div ref={endRef} className="h-px" aria-hidden="true" />
      </div>
    </div>
  );
}
