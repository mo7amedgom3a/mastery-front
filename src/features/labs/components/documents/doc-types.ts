/**
 * Business documents as data: contracts, quotations, forms and reports render from a `DocSpec`
 * in the PDF-style viewer. Forms "fill live" by building the spec from the learner's input;
 * contracts carry redlinable clauses whose options move the deal's acceptance and margin.
 */
import type { BrandColor } from "@/components/ui/brand-colors";

export type ClauseOption = {
  id: string;
  /** Short label for the margin chip and the option list. */
  label: string;
  /** The clause text if this option is chosen. */
  text: string;
  /** Effect on the customer's willingness to sign (points). */
  acceptance: number;
  /** Effect on our margin / risk position (points). */
  margin: number;
  /** A fair middle ground: every redlinable clause offers at least one. */
  balanced?: boolean;
  /** Observer note shown in the debrief when this option is chosen. */
  note?: string;
  /** Change to the annual deal value (SAR) when chosen. */
  valueDelta?: number;
};

export type DocBlock =
  | {
      kind: "clause";
      id: string;
      number?: string;
      title?: string;
      text: string;
      /** Redline alternatives; the first option is "keep as is". */
      options?: readonly ClauseOption[];
      /** Why the customer objects to the current wording (shown when the clause is selected). */
      issue?: string;
    }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "table"; head: readonly string[]; rows: readonly (readonly string[])[]; foot?: readonly string[] }
  | { kind: "fields"; fields: readonly { label: string; value: string; wide?: boolean; empty?: boolean }[] }
  | { kind: "checks"; title?: string; items: readonly { label: string; checked: boolean; note?: string }[] }
  | { kind: "signatures"; parties: readonly { role: string; name: string; signed: boolean; date?: string }[] }
  | { kind: "callout"; tone: "info" | "warn" | "good"; text: string };

export type DocSection = { heading?: string; blocks: readonly DocBlock[] };

/** One A4 page of sections; authors split content across pages. */
export type DocPage = readonly DocSection[];

export type DocSpec = {
  title: string;
  subtitle?: string;
  ref: string;
  date: string;
  issuer: { name: string; tagline?: string; color: BrandColor };
  parties?: readonly { role: string; name: string; detail?: string }[];
  pages: readonly DocPage[];
  footer?: string;
};

export type ClauseBlock = Extract<DocBlock, { kind: "clause" }>;

/** Every clause in a document that has redline options. */
export function redlinableClauses(doc: DocSpec): ClauseBlock[] {
  return doc.pages
    .flat()
    .flatMap((section) => section.blocks)
    .filter((block): block is ClauseBlock => block.kind === "clause" && Boolean(block.options?.length));
}

/** The chosen option of a clause (defaults to the first, "keep as is"). */
export function chosenOption(clause: ClauseBlock, redlines: Readonly<Record<string, string>>): ClauseOption | undefined {
  const options = clause.options ?? [];
  return options.find((option) => option.id === redlines[clause.id]) ?? options[0];
}

/** Acceptance and margin (0–100) of a document given the learner's redlines. */
export function redlineTotals(
  doc: DocSpec,
  redlines: Readonly<Record<string, string>>,
  base: { acceptance: number; margin: number; value: number },
): { acceptance: number; margin: number; value: number; changed: number } {
  let acceptance = base.acceptance;
  let margin = base.margin;
  let value = base.value;
  let changed = 0;
  for (const clause of redlinableClauses(doc)) {
    const option = chosenOption(clause, redlines);
    if (!option) continue;
    acceptance += option.acceptance;
    margin += option.margin;
    value += option.valueDelta ?? 0;
    if (option !== clause.options?.[0]) changed++;
  }
  const bound = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return { acceptance: bound(acceptance), margin: bound(margin), value, changed };
}

/** "4,299 ر.س" style amounts (Latin digits, as in Saudi business documents). */
export function sar(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} ر.س`;
}
