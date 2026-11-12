"use client";

import { FileText, Minus, Plus, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import { DocBlockView } from "./doc-blocks";
import type { DocSpec } from "./doc-types";

const ZOOMS = [0.75, 0.9, 1, 1.15, 1.3] as const;
/** A4 at 96 dpi. */
const PAGE_WIDTH = 794;
const BASE_FONT = 13;

/**
 * A PDF-style document viewer: toolbar (file name, page counter, zoom, print/save as PDF) over a
 * grey canvas of A4 pages. Redlinable clauses become clickable when `onClauseSelect` is given.
 * "حفظ PDF" prints only the pages, through a throwaway iframe that copies the app's styles.
 */
export function DocumentViewer({
  doc,
  fileName,
  signed = false,
  redlines,
  activeClause,
  onClauseSelect,
  className,
  height = "h-[min(78vh,860px)]",
}: {
  doc: DocSpec;
  fileName: string;
  /** Hides the «مسودة» watermark. */
  signed?: boolean;
  redlines?: Readonly<Record<string, string>>;
  activeClause?: string | null;
  onClauseSelect?: (id: string) => void;
  className?: string;
  height?: string;
}) {
  const [zoomIndex, setZoomIndex] = useState(2);
  const [page, setPage] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const zoom = ZOOMS[zoomIndex];
  const total = doc.pages.length;

  // Page counter: the page covering most of the canvas is the current one.
  useEffect(() => {
    const canvas = canvasRef.current;
    const pages = pagesRef.current?.querySelectorAll<HTMLElement>("[data-doc-page]");
    if (!canvas || !pages?.length) return;
    const visible = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(Number((entry.target as HTMLElement).dataset.docPage), entry.intersectionRatio);
        let best = 1;
        let ratio = -1;
        for (const [index, r] of visible) {
          if (r > ratio) {
            ratio = r;
            best = index;
          }
        }
        setPage(best);
      },
      { root: canvas, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pages.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [total]);

  const print = () => {
    const source = pagesRef.current;
    if (!source) return;
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;inset-inline-start:-10000px;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const target = frame.contentDocument;
    if (!target || !frame.contentWindow) return frame.remove();
    const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((node) => node.outerHTML).join("");
    target.open();
    target.write(
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${fileName}</title>${styles}` +
        `<style>@page{size:A4;margin:0}html,body{background:#fff!important;margin:0}` +
        `[data-doc-page]{width:210mm!important;max-width:none!important;min-height:297mm;box-shadow:none!important;margin:0!important;break-after:page;font-size:12px!important}` +
        `[data-doc-pages]{gap:0!important;padding:0!important}</style></head><body>${source.outerHTML}</body></html>`,
    );
    target.close();
    const run = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
    // Give copied stylesheets and fonts a beat to apply.
    window.setTimeout(run, 400);
  };

  return (
    <div className={cn("flex min-w-0 flex-col overflow-hidden rounded-panel border border-line bg-[#e8eaef] dark:bg-[#2a2d35]", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 shrink-0 text-pink" aria-hidden />
          <FileName name={fileName} />
        </span>
        <div className="flex items-center gap-1">
          <span className="rounded-ctl bg-surface-alt px-2 py-1 text-[12px] font-semibold tabular-nums" dir="ltr" aria-label="الصفحة">
            {page} / {total}
          </span>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <button
            type="button"
            aria-label="تصغير"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            className="flex size-8 items-center justify-center rounded-ctl hover:bg-surface-alt disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-12 text-center text-[12px] font-semibold tabular-nums" dir="ltr">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="تكبير"
            disabled={zoomIndex === ZOOMS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOMS.length - 1, i + 1))}
            className="flex size-8 items-center justify-center rounded-ctl hover:bg-surface-alt disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={print}
            className="inline-flex h-8 items-center gap-1.5 rounded-ctl px-2 text-[13px] font-semibold hover:bg-surface-alt"
          >
            <Printer className="size-4" aria-hidden /> حفظ PDF
          </button>
        </div>
      </div>
      <div ref={canvasRef} className={cn("overflow-auto", height)}>
        <div
          ref={pagesRef}
          data-doc-pages
          className="flex flex-col items-center gap-5 p-3 md:p-6"
          // Zoomed past 100% the pages may outgrow the canvas: let it scroll sideways.
          style={{ minWidth: zoom > 1 ? PAGE_WIDTH * zoom + 48 : undefined, containerType: "inline-size" }}
        >
          {doc.pages.map((sections, index) => (
            <article
              key={index}
              data-doc-page={index + 1}
              aria-label={`صفحة ${index + 1} من ${total}`}
              className="relative flex aspect-[1/1.414] flex-col bg-white text-[#1f2430] shadow-[0_2px_12px_rgba(15,23,42,0.18)]"
              style={{
                width: PAGE_WIDTH * zoom,
                maxWidth: zoom > 1 ? "none" : "100%",
                // A page squeezed below A4 width (phones, side panels) scales its type with it.
                fontSize: zoom > 1 ? BASE_FONT * zoom : `min(${BASE_FONT * zoom}px, ${((BASE_FONT / PAGE_WIDTH) * 100).toFixed(3)}cqw)`,
              }}
            >
              {!signed ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
                >
                  <span className="-rotate-[30deg] text-[6em] font-black text-[#1f2430]/[0.05]">مسودة</span>
                </span>
              ) : null}
              <div className="relative flex flex-1 flex-col gap-[1.1em] px-[3em] pt-[2.6em] pb-[3.4em]">
                {index === 0 ? <DocHeader doc={doc} /> : <RunningHeader doc={doc} />}
                {sections.map((section, s) => (
                  <section key={s} className="flex flex-col gap-[0.7em]">
                    {section.heading ? (
                      <h3 className="m-0 border-b border-[#d5d9e2] pb-[0.3em] text-[1.08em] font-bold text-[#1f2430]">{section.heading}</h3>
                    ) : null}
                    {section.blocks.map((block, b) => (
                      <DocBlockView
                        key={"id" in block ? block.id : b}
                        block={block}
                        redlines={redlines}
                        activeClause={activeClause}
                        onClauseSelect={onClauseSelect}
                      />
                    ))}
                  </section>
                ))}
              </div>
              <footer className="absolute inset-x-[3em] bottom-[1.2em] flex items-center justify-between border-t border-[#e3e6ec] pt-[0.5em] text-[0.72em] text-[#7a8190]">
                <span>{doc.footer ?? doc.issuer.name}</span>
                <span dir="ltr">
                  {index + 1} / {total}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "ملحق-عقد-B14.pdf": keep the Latin/number tail in LTR order inside the RTL name. */
function FileName({ name }: { name: string }) {
  const match = name.match(/^(.*?)((?:[A-Za-z0-9][A-Za-z0-9.-]*)?\.pdf)$/);
  return (
    <span className="truncate" dir="rtl">
      {match ? match[1] : name}
      {match ? <bdi dir="ltr">{match[2]}</bdi> : null}
    </span>
  );
}

function DocHeader({ doc }: { doc: DocSpec }) {
  return (
    <header className="flex flex-col gap-[1em]">
      <div className="flex items-start justify-between gap-[1em]">
        <div className="flex items-center gap-[0.7em]">
          <span
            aria-hidden
            className={cn("flex size-[2.8em] items-center justify-center rounded-[0.5em] text-[1.1em] font-black text-ink", brandBg[doc.issuer.color])}
          >
            {doc.issuer.name.replace(/^(شركة|مؤسسة)\s+/, "").slice(0, 1)}
          </span>
          <div className="flex flex-col">
            <span className="text-[1.05em] font-bold">{doc.issuer.name}</span>
            {doc.issuer.tagline ? <span className="text-[0.78em] text-[#5b6170]">{doc.issuer.tagline}</span> : null}
          </div>
        </div>
        <dl className="m-0 grid grid-cols-[auto_auto] gap-x-[0.6em] gap-y-[0.1em] text-[0.78em]">
          <dt className="text-[#5b6170]">المرجع</dt>
          <dd className="m-0 font-semibold" dir="ltr">
            {doc.ref}
          </dd>
          <dt className="text-[#5b6170]">التاريخ</dt>
          <dd className="m-0 font-semibold">{doc.date}</dd>
        </dl>
      </div>
      <div className="flex flex-col items-center gap-[0.2em] border-y-2 border-[#1f2430] py-[0.6em] text-center">
        <h2 className="m-0 text-[1.45em] font-black">{doc.title}</h2>
        {doc.subtitle ? <p className="m-0 text-[0.88em] text-[#5b6170]">{doc.subtitle}</p> : null}
      </div>
      {doc.parties?.length ? (
        <div className="grid grid-cols-2 gap-[0.8em]">
          {doc.parties.map((party) => (
            <div key={party.role} className="flex flex-col gap-[0.1em] rounded-[0.35em] bg-[#f4f6fa] px-[0.8em] py-[0.5em]">
              <span className="text-[0.75em] text-[#5b6170]">{party.role}</span>
              <span className="text-[0.95em] font-bold">{party.name}</span>
              {party.detail ? <span className="text-[0.78em] text-[#5b6170]">{party.detail}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}

function RunningHeader({ doc }: { doc: DocSpec }) {
  return (
    <header className="flex items-center justify-between border-b border-[#e3e6ec] pb-[0.4em] text-[0.75em] text-[#7a8190]">
      <span>{doc.title}</span>
      <span dir="ltr">{doc.ref}</span>
    </header>
  );
}
