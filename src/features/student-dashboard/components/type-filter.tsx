import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { productTypePluralLabel, type TypeCount } from "../model/products";

type TypeFilterProps = {
  /** Types present in the list, with how many of each (see `countByType`). */
  counts: readonly TypeCount[];
  total: number;
  /** The selected product type; null for all. */
  value: string | null;
  onChange: (type: string | null) => void;
  className?: string;
};

function Chip({ label, count, selected, onSelect }: { label: string; count: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn("ma-btn ma-btn--sm min-h-11 gap-2", selected ? "ma-btn--secondary" : "ma-btn--soft")}
    >
      {label}
      <span className="tabular-nums opacity-70">{formatNumber(count)}</span>
    </button>
  );
}

/** Quick filter by product type (courses, diplomas, consultations…). Hidden when there is only one type. */
export function TypeFilter({ counts, total, value, onChange, className }: TypeFilterProps) {
  if (counts.length < 2) return null;
  return (
    <ul aria-label="نوع البرنامج" className={cn("m-0 flex list-none flex-wrap gap-2 p-0", className)}>
      <li>
        <Chip label="الكل" count={total} selected={value === null} onSelect={() => onChange(null)} />
      </li>
      {counts.map(({ type, count }) => (
        <li key={type}>
          <Chip
            label={productTypePluralLabel(type)}
            count={count}
            selected={value === type}
            onSelect={() => onChange(value === type ? null : type)}
          />
        </li>
      ))}
    </ul>
  );
}
