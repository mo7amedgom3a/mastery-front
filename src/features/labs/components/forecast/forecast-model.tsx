"use client";

import { Calculator, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { compact } from "../../content/nuqta/company";
import { forecastFacts } from "../../content/forecast";
import {
  GM_TARGET,
  RUNWAY_TARGET,
  driverMeta,
  fundingOptions,
  runForecast,
  type Drivers,
  type Forecast,
  type Funding,
  type Scenario,
} from "../../model/forecast-sim";
import { LabPanel, OptionCard, Stat } from "../bits";
import { LabTable } from "../workspace/lab-table";

const scenarioLabels: Record<Scenario, string> = { base: "الأساسي", downside: "المتشائم", upside: "المتفائل" };

/** Cash by month as a small line chart with a zero line; red below zero. */
export function CashChart({ forecasts }: { forecasts: { label: string; data: Forecast; tone: string }[] }) {
  const all = forecasts.flatMap((f) => f.data.rows.map((r) => r.cash));
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const w = 560;
  const h = 180;
  const x = (i: number) => 24 + (i / 17) * (w - 40);
  const y = (v: number) => 10 + ((max - v) / (max - min || 1)) * (h - 30);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="النقد شهريًا لكل سيناريو" direction="ltr">
        <line x1={20} x2={w - 10} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="4 4" />
        <text x={w - 12} y={y(0) - 4} fontSize={10} textAnchor="end" fill="currentColor" opacity={0.6}>
          0
        </text>
        {forecasts.map((f) => (
          <polyline
            key={f.label}
            fill="none"
            strokeWidth={2.5}
            className={f.tone}
            stroke="currentColor"
            points={f.data.rows.map((r, i) => `${x(i)},${y(r.cash)}`).join(" ")}
          />
        ))}
        {[1, 6, 12, 18].map((m) => (
          <text key={m} x={x(m - 1)} y={h - 4} fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.6}>
            {`M${m}`}
          </text>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-3 text-[12px] text-fg-muted">
        {forecasts.map((f) => (
          <span key={f.label} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-block h-0.5 w-4 bg-current", f.tone)} aria-hidden /> {f.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** Phase: the 18-month driver model with live outputs and scenario switch. */
export function ModelStep({ initial, onDone }: { initial: Drivers; onDone: (drivers: Drivers) => void }) {
  const [drivers, setDrivers] = useState<Drivers>(initial);
  const [scenario, setScenario] = useState<Scenario>("base");
  const facts = forecastFacts(drivers, "none");
  const view = facts[scenario];
  const months = [1, 3, 6, 9, 12, 15, 18].map((m) => view.rows[m - 1]);
  const rows: { label: string; get: (r: Forecast["rows"][number]) => string; strong?: boolean }[] = [
    { label: "العملاء", get: (r) => String(r.customers) },
    { label: "الإيراد الشهري", get: (r) => compact(r.revenue) },
    { label: "تكلفة الخدمة", get: (r) => compact(-r.cogs) },
    { label: "الربح الإجمالي", get: (r) => compact(r.grossProfit), strong: true },
    { label: "الهامش الإجمالي", get: (r) => `${r.grossMargin}%` },
    { label: "الرواتب", get: (r) => compact(-r.payroll) },
    { label: "التسويق والمبيعات", get: (r) => compact(-r.marketing) },
    { label: "المكتب والأدوات", get: (r) => compact(-r.opex) },
    { label: "EBITDA", get: (r) => compact(r.ebitda), strong: true },
    { label: "النقد آخر الشهر", get: (r) => compact(r.cash), strong: true },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Calculator className="size-5 text-accent" aria-hidden /> المحركات
          </span>
        }
        subtitle="النموذج يُعاد حسابه فورًا. التمويل تختاره في المرحلة التالية."
      >
        {driverMeta.map((meta) => (
          <label key={meta.id} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold">
              {meta.label}
              <span dir="ltr" className="tabular-nums">
                {drivers[meta.id].toLocaleString("en-US")} <span className="text-fg-muted">{meta.unit}</span>
              </span>
            </span>
            <input
              type="range"
              min={meta.min}
              max={meta.max}
              step={meta.step}
              value={drivers[meta.id]}
              onChange={(e) => setDrivers((d) => ({ ...d, [meta.id]: Number(e.target.value) }))}
              className="w-full accent-[var(--accent)]"
              aria-label={meta.label}
            />
            <span className="text-[12px] leading-5 text-fg-muted">{meta.hint}</span>
          </label>
        ))}
      </LabPanel>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="المدرج (أساسي)" value={`${facts.base.runway} شهر`} tone={facts.base.runway >= RUNWAY_TARGET ? "good" : "bad"} hint="دون تمويل جديد" />
          <Stat label="المدرج (متشائم)" value={`${facts.downside.runway} شهر`} tone={facts.downside.runway >= 12 ? "good" : "bad"} />
          <Stat label="الهامش الإجمالي ش12" value={`${facts.base.grossMargin}%`} tone={facts.base.grossMargin >= GM_TARGET ? "good" : "bad"} />
          <Stat label="استرداد CAC" value={`${facts.base.payback} شهر`} tone={facts.base.payback <= 12 ? "good" : "bad"} />
        </div>
        <LabPanel
          title="النموذج الشهري"
          action={
            <div role="tablist" aria-label="السيناريو" className="flex gap-1 rounded-chip border border-line p-1">
              {(Object.keys(scenarioLabels) as Scenario[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  type="button"
                  aria-selected={scenario === s}
                  onClick={() => setScenario(s)}
                  className={cn("rounded-chip px-3 py-1 text-[12px] font-semibold", scenario === s ? "bg-accent text-on-accent" : "text-fg-muted")}
                >
                  {scenarioLabels[s]}
                </button>
              ))}
            </div>
          }
          subtitle={scenario === "downside" ? "سلسلتان (24 فرعًا) تغادران في الشهر 5، والنمو أبطأ 30٪، والتسرب أعلى." : scenario === "upside" ? "نمو أسرع 20٪ بإنفاق تسويق أعلى." : "الافتراضات كما ضبطتها."}
        >
          <LabTable
            dense
            minWidth="min-w-[640px]"
            caption={`النموذج الشهري · ${scenarioLabels[scenario]}`}
            columns={[
              { key: "line", label: "البند" },
              ...months.map((r) => ({ key: `m${r.month}`, label: `ش${r.month}`, numeric: true })),
            ]}
            rows={rows.map((row) => ({
              key: row.label,
              strong: row.strong,
              cells: [
                row.label,
                ...months.map((r) => {
                  const v = row.get(r);
                  return (
                    <bdi key={r.month} dir="ltr" className={cn("tabular-nums", v.startsWith("−") && "text-pink")}>
                      {v}
                    </bdi>
                  );
                }),
              ],
            }))}
          />
          <CashChart
            forecasts={[
              { label: "الأساسي", data: facts.base, tone: "text-sky" },
              { label: "المتشائم", data: facts.downside, tone: "text-pink" },
              { label: "المتفائل", data: facts.upside, tone: "text-green" },
            ]}
          />
        </LabPanel>
        {facts.flags.length ? (
          <ul className="m-0 flex list-none flex-col gap-1 rounded-photo border border-yellow bg-yellow/10 p-3 text-[13px] leading-6">
            {facts.flags.map((f) => (
              <li key={f.id} className="inline-flex items-start gap-2">
                <TriangleAlert className="mt-1 size-3.5 shrink-0 text-yellow" aria-hidden /> {f.text}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end">
          <Button size="lg" onClick={() => onDone(drivers)}>
            اعتمد الافتراضات
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Phase: choose the funding route, comparing runway in base and downside for each. */
export function FundingStep({ drivers, onDone }: { drivers: Drivers; onDone: (funding: Funding) => void }) {
  const [funding, setFunding] = useState<Funding | null>(null);
  return (
    <LabPanel title="قرار التمويل" subtitle="قارن المدرج في كل خيار. المستثمر سيسأل عن السيناريو المتشائم أولًا.">
      <div className="grid gap-3 md:grid-cols-2">
        {fundingOptions.map((option) => {
          const base = runForecast(drivers, "base", option.id);
          const down = runForecast(drivers, "downside", option.id);
          return (
            <OptionCard
              key={option.id}
              selected={funding === option.id}
              onSelect={() => setFunding(option.id)}
              title={option.label}
              detail={
                <span className="flex flex-col gap-1">
                  <span>{option.detail}</span>
                  <span className="font-semibold text-fg tabular-nums">
                    المدرج: {base.runway} شهر (أساسي) · {down.runway} شهر (متشائم)
                  </span>
                </span>
              }
            />
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button disabled={!funding} onClick={() => funding && onDone(funding)}>
          ادخل اجتماع المستثمر
        </Button>
      </div>
    </LabPanel>
  );
}
