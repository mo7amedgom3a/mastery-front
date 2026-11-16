/**
 * Quarter-close mechanics, pure and testable: close-calendar dependencies, bank reconciliation,
 * journal-entry checks and the VAT return arithmetic. The scenario data lives in `content/close.ts`.
 */

// ---------- close calendar ----------

/** Working days relative to period end: −2 (before) … +5, plus 20 for "before the VAT deadline". */
export type CloseDay = -2 | -1 | 1 | 2 | 3 | 4 | 5 | 20;

export type CloseTask = { id: string; label: string; owner: string; after: readonly string[]; latest: CloseDay; earliest?: CloseDay };

export function calendarIssues(tasks: readonly CloseTask[], plan: Readonly<Record<string, CloseDay | undefined>>): string[] {
  const issues: string[] = [];
  for (const task of tasks) {
    const day = plan[task.id];
    if (day === undefined) {
      issues.push(`«${task.label}» بلا موعد.`);
      continue;
    }
    if (day > task.latest) issues.push(`«${task.label}» متأخرة عن موعدها النهائي.`);
    if (task.earliest !== undefined && day < task.earliest) issues.push(`«${task.label}» لا يمكن أن تبدأ قبل نهاية الفترة.`);
    for (const dep of task.after) {
      const depTask = tasks.find((t) => t.id === dep);
      const depDay = plan[dep];
      if (depTask && depDay !== undefined && depDay > day) issues.push(`«${task.label}» قبل «${depTask.label}» التي تعتمد عليها.`);
    }
  }
  return issues;
}

// ---------- bank reconciliation ----------

export type RecLine = { id: string; side: "bank" | "book"; date: string; text: string; amount: number };

export type ExceptionKind = "dit" | "oc" | "fee" | "receipt" | "duplicate" | "plug";

export const exceptionKinds: readonly { id: ExceptionKind; label: string; side: "bank" | "book" | "any" }[] = [
  { id: "dit", label: "إيداع بالطريق (توقيت · يُضاف لرصيد البنك)", side: "book" },
  { id: "oc", label: "شيك معلّق لم يُصرف (توقيت · يُطرح من رصيد البنك)", side: "book" },
  { id: "duplicate", label: "قيد مكرر في الدفاتر (يُعكس)", side: "book" },
  { id: "fee", label: "رسوم بنكية غير مسجلة (قيد في الدفاتر)", side: "bank" },
  { id: "receipt", label: "تحصيل من عميل غير مسجل (قيد في الدفاتر)", side: "bank" },
  { id: "plug", label: "فرق غير مبرر: قيد في حساب «متفرقات» لإغلاق الفرق", side: "any" },
];

/** Effect of a classified exception on the adjusted bank and book balances. */
function exceptionEffect(line: RecLine, kind: ExceptionKind): { bank: number; book: number } {
  switch (kind) {
    case "dit":
    case "oc":
      return { bank: line.amount, book: 0 };
    case "duplicate":
      return { bank: 0, book: -line.amount };
    case "fee":
    case "receipt":
      return { bank: 0, book: line.amount };
    case "plug":
      return { bank: 0, book: 0 };
  }
}

export type RecResult = {
  adjustedBank: number;
  adjustedBook: number;
  difference: number;
  wrongPairs: number;
  unclassified: number;
  plugs: number;
};

/**
 * Adjusted balances from the learner's matches and classifications. A pair with unequal amounts
 * counts as wrong; a "plug" leaves the difference in place but books it to suspense (the trap).
 */
export function reconcile(
  lines: readonly RecLine[],
  balances: { bank: number; book: number },
  pairs: readonly (readonly [string, string])[],
  classes: Readonly<Record<string, ExceptionKind | undefined>>,
): RecResult {
  const byId = new Map(lines.map((line) => [line.id, line]));
  const matched = new Set<string>();
  let wrongPairs = 0;
  for (const [a, b] of pairs) {
    const x = byId.get(a);
    const y = byId.get(b);
    if (!x || !y || x.side === y.side || x.amount !== y.amount) wrongPairs++;
    matched.add(a);
    matched.add(b);
  }
  let bank = balances.bank;
  let book = balances.book;
  let unclassified = 0;
  let plugs = 0;
  for (const line of lines) {
    if (matched.has(line.id)) continue;
    const kind = classes[line.id];
    if (!kind) {
      unclassified++;
      continue;
    }
    if (kind === "plug") plugs++;
    const effect = exceptionEffect(line, kind);
    bank += effect.bank;
    book += effect.book;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { adjustedBank: round(bank), adjustedBook: round(book), difference: round(bank - book), wrongPairs, unclassified, plugs };
}

// ---------- journal entries ----------

export type JournalEntry = { debit: string; credit: string; amount: number };
export type JeTask = { id: string; title: string; brief: string; answer: JournalEntry; tolerance?: number; why: string };

export function checkEntry(task: JeTask, entry: JournalEntry | undefined): { accounts: boolean; amount: boolean } {
  if (!entry) return { accounts: false, amount: false };
  const accounts = entry.debit === task.answer.debit && entry.credit === task.answer.credit;
  const amount = Math.abs(entry.amount - task.answer.amount) <= (task.tolerance ?? 0);
  return { accounts, amount };
}

// ---------- VAT return ----------

export const VAT_RATE = 0.15;

export type VatLine = {
  id: string;
  kind: "sale" | "purchase";
  label: string;
  net: number;
  /** "standard" 15%, "zero" (export of services), "reverse" (imported services: output and input). */
  treatment: "standard" | "zero" | "reverse";
  /** For purchases: whether the input VAT is deductible (blocked items and invoices without a VAT number are not). */
  deductible?: boolean;
  hint?: string;
};

export type VatReturn = { outputVat: number; inputVat: number; net: number; salesStandard: number; salesZero: number };

/** Return boxes from the lines the learner chose to deduct (sales are always declared). */
export function vatReturn(lines: readonly VatLine[], deducted: readonly string[]): VatReturn {
  let outputVat = 0;
  let inputVat = 0;
  let salesStandard = 0;
  let salesZero = 0;
  for (const line of lines) {
    if (line.kind === "sale") {
      if (line.treatment === "zero") salesZero += line.net;
      else {
        salesStandard += line.net;
        outputVat += line.net * VAT_RATE;
      }
      continue;
    }
    if (line.treatment === "reverse") outputVat += line.net * VAT_RATE;
    if (deducted.includes(line.id)) inputVat += line.net * VAT_RATE;
  }
  const r = (n: number) => Math.round(n);
  return { outputVat: r(outputVat), inputVat: r(inputVat), net: r(outputVat - inputVat), salesStandard, salesZero };
}

/** The deductions a correct return makes. */
export function correctDeductions(lines: readonly VatLine[]): string[] {
  return lines.filter((line) => line.kind === "purchase" && line.deductible).map((line) => line.id);
}

// ---------- variance analysis ----------

export type VarianceLine = { id: string; label: string; budget: number; actual: number; reasons: readonly { id: string; label: string; correct: boolean }[] };

/** Material when the variance is at least `pct` of budget AND at least `abs` SAR. */
export function isMaterial(line: VarianceLine, threshold: { pct: number; abs: number }): boolean {
  const diff = Math.abs(line.actual - line.budget);
  return diff >= threshold.abs && diff >= Math.abs(line.budget) * threshold.pct;
}
