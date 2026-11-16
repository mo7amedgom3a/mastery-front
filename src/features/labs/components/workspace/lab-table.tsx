import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { valueDir } from "../bits";

export type LabColumn = {
  key: string;
  label: ReactNode;
  /** Figures: aligned to the column end, tabular digits, rendered left-to-right. */
  numeric?: boolean;
  /** Overrides the alignment (e.g. "center" for a radio matrix). */
  align?: "start" | "end" | "center";
  className?: string;
};

export type LabRow = {
  key: string;
  cells: readonly ReactNode[];
  /** Totals and key lines. */
  strong?: boolean;
  className?: string;
};

const alignClass = { start: "text-start", end: "text-end", center: "text-center" } as const;
/** Filled header/footer cells: a 1px same-colour shadow hides anti-aliasing seams at fractional column edges. */
const filled = "bg-surface-alt shadow-[1px_0_0_var(--surface-alt),-1px_0_0_var(--surface-alt)]";

/** Wraps a cell value so figures keep LTR order without flipping the cell's alignment. */
function Value({ value, numeric }: { value: ReactNode; numeric?: boolean }) {
  if (numeric && (typeof value === "string" || typeof value === "number")) {
    return (
      <bdi dir={valueDir(value) ?? "auto"} className="tabular-nums">
        {value}
      </bdi>
    );
  }
  return <>{value}</>;
}

/**
 * The one table every lab surface uses (panels, evidence, worksheets, matrices). Theme tokens
 * only, so it reads the same in light and dark mode. Tables printed on the A4 page inside
 * `DocumentViewer` are styled for paper by `DocBlockView` instead.
 */
export function LabTable({
  columns,
  rows,
  foot,
  minWidth,
  caption,
  dense = false,
  className,
}: {
  columns: readonly LabColumn[];
  rows: readonly LabRow[];
  foot?: readonly ReactNode[];
  /** Horizontal scroll below this width (e.g. "min-w-[640px]"). */
  minWidth?: string;
  caption?: string;
  dense?: boolean;
  className?: string;
}) {
  const pad = dense ? "px-2.5 py-1.5" : "px-3 py-2";
  const align = (column: LabColumn) => alignClass[column.align ?? (column.numeric ? "end" : "start")];
  return (
    <div className={cn("overflow-x-auto rounded-photo border border-line bg-surface", className)}>
      <table className={cn("w-full border-collapse text-[13px] leading-6 text-fg", minWidth)}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(pad, filled, "text-[12px] font-semibold whitespace-nowrap text-fg-muted", align(column), column.className)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={cn("border-b border-line last:border-b-0", row.strong && "font-bold", row.className)}>
              {row.cells.map((value, c) => {
                const column = columns[c];
                return (
                  <td key={column?.key ?? c} className={cn(pad, "align-middle", column && align(column), column?.className)}>
                    <Value value={value} numeric={column?.numeric} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {foot ? (
          <tfoot>
            <tr className="border-t border-line font-bold">
              {foot.map((value, c) => {
                const column = columns[c];
                return (
                  <td key={column?.key ?? c} className={cn(pad, filled, column && align(column))}>
                    <Value value={value} numeric={column?.numeric} />
                  </td>
                );
              })}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
