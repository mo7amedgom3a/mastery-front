import { valueDir } from "../bits";
import { LabTable } from "./lab-table";

/**
 * A plain string table (briefs, evidence) on top of `LabTable`. A column whose cells are all
 * figures (no Arabic text) becomes a numeric column; the first column is the row label.
 */
export function DataTable({
  head,
  rows,
  foot,
  className,
}: {
  head: readonly string[];
  rows: readonly (readonly string[])[];
  foot?: readonly string[];
  className?: string;
}) {
  const columns = head.map((label, c) => ({
    key: `${c}-${label}`,
    label,
    numeric: c > 0 && rows.length > 0 && rows.every((row) => Boolean(row[c]) && valueDir(row[c]) === "ltr"),
    className: c === 0 ? "font-semibold" : undefined,
  }));
  return (
    <LabTable
      columns={columns}
      rows={rows.map((cells, r) => ({ key: String(r), cells }))}
      foot={foot}
      className={className}
    />
  );
}
