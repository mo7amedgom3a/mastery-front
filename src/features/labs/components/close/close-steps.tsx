"use client";

import { ArrowLeftRight, CalendarClock, FileSpreadsheet, Landmark, Receipt, Scale, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import {
  MATERIALITY,
  accounts,
  closeDays,
  closeTasks,
  jeTasks,
  recBalances,
  recLines,
  varianceLines,
  vatDueOptions,
  vatLines,
} from "../../content/close";
import { money } from "../../content/nuqta/company";
import {
  calendarIssues,
  exceptionKinds,
  reconcile,
  vatReturn,
  type CloseDay,
  type ExceptionKind,
  type JournalEntry,
} from "../../model/close-engine";
import { LabPanel, OptionCard, Stat } from "../bits";
import { LabTable } from "../workspace/lab-table";

const title = (icon: ReactNode, text: string) => (
  <span className="inline-flex items-center gap-2">
    {icon} {text}
  </span>
);

// ---------- 1. close calendar ----------

export function CalendarStep({ onDone }: { onDone: (plan: Record<string, CloseDay>) => void }) {
  const [plan, setPlan] = useState<Record<string, CloseDay | undefined>>({});
  const [checked, setChecked] = useState(false);
  const issues = calendarIssues(closeTasks, plan);
  const complete = closeTasks.every((task) => plan[task.id] !== undefined);
  return (
    <LabPanel
      title={title(<CalendarClock className="size-5 text-accent" aria-hidden />, "تقويم إقفال الربع الثالث")}
      subtitle="حدد يوم كل مهمة. الربع ينتهي 30 سبتمبر، والمديرة المالية تريد الحزمة موقعة في يوم العمل الخامس."
    >
      <LabTable
        minWidth="min-w-[640px]"
        caption="مهام الإقفال"
        columns={[
          { key: "task", label: "المهمة", className: "font-semibold" },
          { key: "owner", label: "المسؤول", className: "text-fg-muted" },
          { key: "day", label: "اليوم" },
        ]}
        rows={closeTasks.map((task) => ({
          key: task.id,
          cells: [
            task.label,
            task.owner,
            <select
              key="day"
              className="ma-select h-10 w-44 text-[13px]"
              aria-label={`يوم ${task.label}`}
              value={plan[task.id] ?? ""}
              onChange={(e) => {
                setChecked(false);
                setPlan((p) => ({ ...p, [task.id]: e.target.value === "" ? undefined : (Number(e.target.value) as CloseDay) }));
              }}
            >
              <option value="">اختر…</option>
              {closeDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.label}
                </option>
              ))}
            </select>,
          ],
        }))}
      />
      {checked && issues.length ? (
        <ul className="m-0 flex list-none flex-col gap-1 rounded-photo border border-yellow bg-yellow/10 p-3 text-[13px] leading-6">
          {issues.map((issue) => (
            <li key={issue} className="inline-flex items-start gap-2">
              <TriangleAlert className="mt-1 size-3.5 shrink-0 text-yellow" aria-hidden /> {issue}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={!complete} onClick={() => setChecked(true)}>
          تحقق من الاعتماديات
        </Button>
        <Button disabled={!complete} onClick={() => onDone(plan as Record<string, CloseDay>)}>
          اعتمد التقويم وابدأ
        </Button>
      </div>
    </LabPanel>
  );
}

// ---------- 2. bank reconciliation ----------

export function ReconciliationStep({
  onDone,
}: {
  onDone: (pairs: (readonly [string, string])[], classes: Record<string, ExceptionKind>) => void;
}) {
  const [pairs, setPairs] = useState<(readonly [string, string])[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [classes, setClasses] = useState<Record<string, ExceptionKind>>({});
  const [warning, setWarning] = useState<string | null>(null);
  const matched = new Set(pairs.flat());
  const rec = reconcile(recLines, recBalances, pairs, classes);
  const open = recLines.filter((line) => !matched.has(line.id));

  const select = (id: string) => {
    setWarning(null);
    if (matched.has(id)) {
      setPairs((p) => p.filter((pair) => !pair.includes(id)));
      return;
    }
    if (!pick) return setPick(id);
    if (pick === id) return setPick(null);
    const a = recLines.find((l) => l.id === pick);
    const b = recLines.find((l) => l.id === id);
    if (!a || !b) return;
    if (a.side === b.side) return setPick(id);
    if (a.amount !== b.amount) {
      setWarning("المبلغان مختلفان: لا يمكن مطابقتهما.");
      return setPick(null);
    }
    setPairs((p) => [...p, a.side === "bank" ? ([a.id, b.id] as const) : ([b.id, a.id] as const)]);
    setClasses((c) => {
      const next = { ...c };
      delete next[a.id];
      delete next[b.id];
      return next;
    });
    setPick(null);
  };

  const column = (side: "bank" | "book") => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
        {side === "bank" ? <Landmark className="size-4 text-sky" aria-hidden /> : <FileSpreadsheet className="size-4 text-green" aria-hidden />}
        {side === "bank" ? "كشف البنك · سبتمبر" : "دفتر حساب البنك"}
      </h3>
      {recLines
        .filter((line) => line.side === side)
        .map((line) => {
          const isMatched = matched.has(line.id);
          return (
            <button
              key={line.id}
              type="button"
              aria-pressed={pick === line.id || isMatched}
              onClick={() => select(line.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-photo border px-3 py-2 text-start text-[13px] transition-colors",
                isMatched ? "border-green bg-green/10 text-fg-muted" : pick === line.id ? "border-accent bg-accent/10" : "border-line hover:border-line-strong",
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{line.text}</span>
                <span className="text-[12px] text-fg-muted tabular-nums">{line.date}</span>
              </span>
              <span dir="ltr" className={cn("shrink-0 font-bold tabular-nums", line.amount < 0 ? "text-pink" : "text-green")}>
                {line.amount.toLocaleString("en-US")}
              </span>
            </button>
          );
        })}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <LabPanel
        title={title(<ArrowLeftRight className="size-5 text-accent" aria-hidden />, "مطابقة البنك والدفاتر")}
        subtitle="اضغط سطرًا من البنك ثم ما يقابله في الدفاتر. اضغط سطرًا مطابقًا لفك المطابقة."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {column("bank")}
          {column("book")}
        </div>
        {warning ? <p className="m-0 text-[13px] font-semibold text-pink">{warning}</p> : null}
      </LabPanel>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <LabPanel title="البنود المعلقة" subtitle="صنّف كل بند لم يُطابق: هل هو فرق توقيت أم خطأ يحتاج قيدًا؟">
          {open.length === 0 ? <p className="m-0 text-[13px] text-fg-muted">لا بنود معلقة.</p> : null}
          {open.map((line) => (
            <div key={line.id} className="flex flex-col gap-1.5 rounded-photo border border-line p-3">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="font-semibold">
                  {line.side === "bank" ? "بنك" : "دفاتر"} · {line.text}
                </span>
                <span dir="ltr" className="font-bold tabular-nums">
                  {line.amount.toLocaleString("en-US")}
                </span>
              </div>
              <select
                className="ma-select h-10 text-[13px]"
                aria-label={`تصنيف ${line.text}`}
                value={classes[line.id] ?? ""}
                onChange={(e) => setClasses((c) => ({ ...c, [line.id]: e.target.value as ExceptionKind }))}
              >
                <option value="">اختر التصنيف…</option>
                {exceptionKinds
                  .filter((kind) => kind.side === "any" || kind.side === line.side)
                  .map((kind) => (
                    <option key={kind.id} value={kind.id}>
                      {kind.label}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </LabPanel>
        <LabPanel title={title(<Scale className="size-5 text-accent" aria-hidden />, "ورقة التسوية")}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="رصيد البنك المعدّل" value={rec.adjustedBank.toLocaleString("en-US")} />
            <Stat label="رصيد الدفاتر المعدّل" value={rec.adjustedBook.toLocaleString("en-US")} />
          </div>
          <Stat
            label="الفرق"
            value={rec.difference.toLocaleString("en-US")}
            tone={rec.difference === 0 && rec.unclassified === 0 ? "good" : "bad"}
            hint={rec.unclassified ? `${rec.unclassified} بنود بلا تصنيف` : rec.plugs ? "أُغلق بقيد متفرقات" : undefined}
          />
          <Button size="lg" block disabled={rec.unclassified > 0} onClick={() => onDone(pairs, classes)}>
            اعتمد التسوية
          </Button>
        </LabPanel>
      </div>
    </div>
  );
}

// ---------- 3. adjusting entries ----------

export function EntriesStep({ onDone }: { onDone: (entries: Record<string, JournalEntry>) => void }) {
  const [entries, setEntries] = useState<Record<string, Partial<JournalEntry> & { raw?: string }>>({});
  const set = (id: string, patch: Partial<JournalEntry> & { raw?: string }) => setEntries((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  const complete = jeTasks.every((task) => {
    const e = entries[task.id];
    return e?.debit && e.credit && e.amount && e.debit !== e.credit;
  });
  return (
    <LabPanel
      title={title(<Receipt className="size-5 text-accent" aria-hidden />, "قيود التسوية لنهاية الربع")}
      subtitle="لكل حالة: الحساب المدين، الحساب الدائن، والمبلغ. القيد المتوازن ليس بالضرورة صحيحًا."
    >
      <div className="flex flex-col gap-4">
        {jeTasks.map((task, index) => {
          const e = entries[task.id] ?? {};
          return (
            <fieldset key={task.id} className="m-0 flex flex-col gap-3 rounded-photo border border-line p-4">
              <legend className="px-1 text-sm font-bold">
                قيد {index + 1}: {task.title}
              </legend>
              <p className="m-0 text-[13px] leading-6 text-fg-muted">{task.brief}</p>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_160px]">
                <label className="flex flex-col gap-1 text-[12px] font-semibold">
                  مدين
                  <select className="ma-select h-10 text-[13px]" value={e.debit ?? ""} onChange={(ev) => set(task.id, { debit: ev.target.value })}>
                    <option value="">اختر الحساب…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-semibold">
                  دائن
                  <select className="ma-select h-10 text-[13px]" value={e.credit ?? ""} onChange={(ev) => set(task.id, { credit: ev.target.value })}>
                    <option value="">اختر الحساب…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-semibold">
                  المبلغ (ر.س)
                  <input
                    className="ma-input h-10 text-end"
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="0"
                    value={e.raw ?? ""}
                    onChange={(ev) => {
                      const raw = ev.target.value.replace(/[^\d]/g, "");
                      set(task.id, { raw, amount: Number(raw) || 0 });
                    }}
                  />
                </label>
              </div>
              {e.debit && e.debit === e.credit ? <p className="m-0 text-[12px] text-pink">المدين والدائن الحساب نفسه.</p> : null}
            </fieldset>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          disabled={!complete}
          onClick={() =>
            onDone(
              Object.fromEntries(
                jeTasks.map((task) => {
                  const e = entries[task.id];
                  return [task.id, { debit: e?.debit ?? "", credit: e?.credit ?? "", amount: e?.amount ?? 0 }];
                }),
              ),
            )
          }
        >
          رحّل القيود
        </Button>
      </div>
    </LabPanel>
  );
}

// ---------- 4. VAT return ----------

export function VatStep({ onDone }: { onDone: (deducted: string[], due: string) => void }) {
  const purchases = vatLines.filter((line) => line.kind === "purchase");
  const [deducted, setDeducted] = useState<string[]>(purchases.map((p) => p.id));
  const [due, setDue] = useState<string>("");
  const ret = vatReturn(vatLines, deducted);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <LabPanel
        title={title(<Receipt className="size-5 text-accent" aria-hidden />, "إقرار ضريبة القيمة المضافة · الربع الثالث")}
        subtitle="المبيعات تُصرّح كلها. في المشتريات اختر ما يُخصم من ضريبة المدخلات فقط. مسودة المحاسب خصمت كل شيء."
      >
        <h3 className="m-0 text-sm font-bold">المبيعات</h3>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {vatLines
            .filter((l) => l.kind === "sale")
            .map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2 rounded-photo border border-line px-3 py-2 text-[13px]">
                <span>
                  {line.label} · <span className="text-fg-muted">{line.treatment === "zero" ? "نسبة صفر" : "15٪"}</span>
                </span>
                <span dir="ltr" className="font-bold tabular-nums">
                  {line.net.toLocaleString("en-US")}
                </span>
              </li>
            ))}
        </ul>
        <h3 className="m-0 text-sm font-bold">المشتريات: خصم ضريبة المدخلات؟</h3>
        <div className="flex flex-col gap-2">
          {purchases.map((line) => (
            <OptionCard
              key={line.id}
              multi
              selected={deducted.includes(line.id)}
              onSelect={() => setDeducted((d) => (d.includes(line.id) ? d.filter((x) => x !== line.id) : [...d, line.id]))}
              title={`${line.label} · ${line.net.toLocaleString("en-US")} ر.س`}
              detail={`ضريبة ${Math.round(line.net * 0.15).toLocaleString("en-US")} ر.س${line.treatment === "reverse" ? " · احتساب عكسي" : ""}`}
            />
          ))}
        </div>
      </LabPanel>
      <LabPanel title="ملخص الإقرار" subtitle="القيم تُحسب من اختياراتك.">
        <Stat label="ضريبة المخرجات" value={money(ret.outputVat)} />
        <Stat label="ضريبة المدخلات" value={money(ret.inputVat)} />
        <Stat label="صافي المستحق" value={money(ret.net)} />
        <div role="radiogroup" aria-label="موعد التقديم" className="flex flex-col gap-2">
          <span className="text-[13px] font-bold">موعد التقديم والسداد</span>
          {vatDueOptions.map((option) => (
            <OptionCard key={option.id} selected={due === option.id} onSelect={() => setDue(option.id)} title={option.label} />
          ))}
        </div>
        <Button size="lg" block disabled={!due} onClick={() => onDone(deducted, due)}>
          اعتمد الإقرار
        </Button>
      </LabPanel>
    </div>
  );
}

// ---------- 5. variance analysis ----------

export function VarianceStep({ onDone }: { onDone: (flags: string[], reasons: Record<string, string>) => void }) {
  const [flags, setFlags] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const complete = flags.length > 0 && flags.every((id) => reasons[id]);
  return (
    <LabPanel
      title={title(<FileSpreadsheet className="size-5 text-accent" aria-hidden />, "الفعلي مقابل الموازنة")}
      subtitle={`حد الأهمية: ${MATERIALITY.pct * 100}٪ من الموازنة و${MATERIALITY.abs.toLocaleString("en-US")} ر.س معًا. علّم الجوهري فقط وفسّره.`}
    >
      <LabTable
        minWidth="min-w-[680px]"
        caption="الفعلي مقابل الموازنة"
        columns={[
          { key: "line", label: "البند", className: "font-semibold" },
          { key: "budget", label: "الموازنة", numeric: true },
          { key: "actual", label: "الفعلي", numeric: true },
          { key: "diff", label: "الانحراف", numeric: true },
          { key: "flag", label: "جوهري؟ والسبب" },
        ]}
        rows={varianceLines.map((line) => {
          const diff = line.actual - line.budget;
          const pct = Math.round((diff / line.budget) * 100);
          const flagged = flags.includes(line.id);
          const sign = (n: number) => (n > 0 ? "+" : "");
          return {
            key: line.id,
            cells: [
              line.label,
              line.budget.toLocaleString("en-US"),
              line.actual.toLocaleString("en-US"),
              <bdi key="diff" dir="ltr" className={cn("font-bold tabular-nums", diff < 0 && "text-pink")}>
                {`${sign(diff)}${diff.toLocaleString("en-US")} (${sign(pct)}${pct}%)`}
              </bdi>,
              <div key="flag" className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent)]"
                    checked={flagged}
                    onChange={() => setFlags((f) => (flagged ? f.filter((x) => x !== line.id) : [...f, line.id]))}
                  />
                  جوهري
                </label>
                {flagged ? (
                  <select
                    className="ma-select h-10 text-[13px]"
                    aria-label={`سبب انحراف ${line.label}`}
                    value={reasons[line.id] ?? ""}
                    onChange={(e) => setReasons((r) => ({ ...r, [line.id]: e.target.value }))}
                  >
                    <option value="">اختر التفسير…</option>
                    {line.reasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>,
            ],
          };
        })}
      />
      <div className="flex justify-end">
        <Button disabled={!complete} onClick={() => onDone(flags, reasons)}>
          أرسل الحزمة للمراجعة
        </Button>
      </div>
    </LabPanel>
  );
}
