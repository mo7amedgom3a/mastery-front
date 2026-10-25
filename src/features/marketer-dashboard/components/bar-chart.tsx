"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BarPoint = { key: string; label: string; value: number };

// One series per chart (no legend; the title names it). Brand coral stepped to pass the chart
// lightness band and 3:1 against both surfaces (dataviz validator, light #ffffff and dark #17161b).
const BAR = "#e8503f";
const HEIGHT = 160;
const PAD_TOP = 8;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

/** Rounded top corners (4px) on a bar anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * A daily bar chart with a per-bar hover/focus tooltip, recessive grid and a data table for screen
 * readers and anyone who wants the numbers.
 */
export function BarChart({
  title,
  data,
  format,
  summary,
}: {
  title: string;
  data: BarPoint[];
  format: (value: number) => string;
  /** Headline under the title, e.g. the period total. */
  summary?: ReactNode;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const width = Math.max(data.length * 12, 280);
  const slot = width / Math.max(data.length, 1);
  const gap = Math.min(2, slot / 3);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const plot = HEIGHT - PAD_TOP;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const point = active !== null ? data[active] : null;
  const empty = data.every((d) => d.value === 0);

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5" aria-labelledby={`${id}-title`}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span id={`${id}-title`} className="text-base font-bold">{title}</span>
        {summary ? <span className="text-sm text-fg-muted">{summary}</span> : null}
      </figcaption>

      <div className="relative" dir="ltr">
        <div className="flex gap-2">
          <div className="flex shrink-0 flex-col justify-between text-end text-[11px] leading-none text-fg-muted" style={{ height: HEIGHT, paddingTop: PAD_TOP }} aria-hidden="true">
            {[...ticks].reverse().map((t) => (
              <span key={t} className="-translate-y-1/2 tabular-nums last:translate-y-0">{format(t)}</span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${width} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="block h-40 w-full overflow-visible"
              role="img"
              aria-label={`${title}: ${data.length} يوم`}
              onMouseLeave={() => setActive(null)}
            >
              {ticks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={width}
                  y1={HEIGHT - (t / max) * plot}
                  y2={HEIGHT - (t / max) * plot}
                  stroke="currentColor"
                  strokeOpacity={t === 0 ? 0.32 : 0.1}
                  vectorEffect="non-scaling-stroke"
                  className="text-fg"
                />
              ))}
              {data.map((d, index) => {
                const h = (d.value / max) * plot;
                const x = index * slot + gap / 2;
                const w = Math.max(slot - gap, 1);
                return (
                  <g key={d.key}>
                    {h > 0 ? (
                      <path d={barPath(x, HEIGHT - h, w, h)} fill={BAR} fillOpacity={active === null || active === index ? 1 : 0.45} />
                    ) : null}
                    {/* Hit target: the whole column, taller and wider than the bar. */}
                    <rect
                      x={index * slot}
                      y={0}
                      width={slot}
                      height={HEIGHT}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${d.label}: ${format(d.value)}`}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                      className="cursor-default outline-none"
                    />
                  </g>
                );
              })}
            </svg>
            {point && active !== null ? (
              <div
                role="status"
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-xs shadow-sm whitespace-nowrap"
                style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
              >
                <span className="block text-fg-muted">{point.label}</span>
                <strong className="tabular-nums">{format(point.value)}</strong>
              </div>
            ) : null}
            {empty ? (
              <p className="absolute inset-0 m-0 grid place-items-center text-sm text-fg-muted" dir="rtl">لا بيانات في هذه الفترة</p>
            ) : null}
            <div className="mt-1.5 flex text-[11px] text-fg-muted" aria-hidden="true">
              {data.map((d, index) => (
                <span key={d.key} className="min-w-0 flex-1 text-center whitespace-nowrap" style={{ visibility: index % labelEvery === 0 ? "visible" : "hidden" }}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-fg-muted">عرض البيانات كجدول</summary>
        <div className="mt-2 max-h-60 overflow-auto rounded-control border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-xs text-fg-muted">
                <th scope="col" className="p-2 text-start">اليوم</th>
                <th scope="col" className="p-2 text-end">{title}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className={cn("border-t border-line", d.value === 0 && "text-fg-muted")}>
                  <td className="p-2">{d.label}</td>
                  <td className="p-2 text-end tabular-nums">{format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
