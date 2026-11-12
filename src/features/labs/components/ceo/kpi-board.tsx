"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, rtlXAxis, rtlYAxis, type ChartConfig } from "@/components/ui/chart";

import { RUNWAY_TARGET, START_SHARE, TARGET_SHARE, type MarketState } from "../../model/market-sim";
import { LabPanel, Stat } from "../bits";

const chartConfig = {
  share: { label: "الحصة ٪", color: kitColor("coral") },
  runway: { label: "مدة النقد (شهر)", color: kitColor("sky") },
} satisfies ChartConfig;

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

/** CEO dashboard: KPI tiles against last quarter, plus share and runway per quarter. */
export function KpiBoard({ market }: { market: MarketState }) {
  const prev = market.history.at(-2);
  const delta = (now: number, before: number | undefined, unit = "") => {
    if (before === undefined) return undefined;
    const d = Math.round((now - before) * 10) / 10;
    return `${d >= 0 ? "+" : ""}${fmt(d)}${unit} عن الربع السابق`;
  };
  const rows = [
    { q: "البداية", share: START_SHARE, runway: 30 },
    ...market.history.map((h) => ({ q: `ر${h.quarter}`, share: h.share, runway: h.runway })),
  ];

  return (
    <LabPanel title="لوحة الرئيس التنفيذي" subtitle={`الهدف: حصة ${TARGET_SHARE}٪ أو أكثر، ونقد يكفي ${RUNWAY_TARGET} شهرًا على الأقل`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="الحصة السوقية" value={`${fmt(market.share)}%`} hint={delta(market.share, prev?.share, "٪")} tone={market.share >= TARGET_SHARE ? "good" : undefined} />
        <Stat label="النقد (مليون ر.س)" value={fmt(market.cash)} hint={delta(market.cash, prev?.cash)} />
        <Stat
          label="مدة النقد (شهر)"
          value={fmt(market.runway)}
          tone={market.runway < 6 ? "bad" : market.runway >= RUNWAY_TARGET ? "good" : undefined}
          hint={market.runway < 6 ? "خطر: أقل من 6 أشهر" : undefined}
        />
        <Stat label="رضا العملاء NPS" value={market.nps} hint={delta(market.nps, prev?.nps)} />
        <Stat label="معنويات الفريق" value={market.morale} hint={delta(market.morale, prev?.morale)} tone={market.morale < 45 ? "bad" : undefined} />
        <Stat label="زمن التوصيل (دقيقة)" value={market.deliveryMinutes} hint="فوري: 25 دقيقة" />
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
        <LineChart data={rows} margin={{ top: 8, left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="q" {...rtlXAxis} />
          <YAxis yAxisId="share" {...rtlYAxis} domain={[20, 40]} />
          <YAxis yAxisId="runway" orientation="left" tickLine={false} axisLine={false} width={32} domain={[0, 36]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine yAxisId="share" y={TARGET_SHARE} strokeDasharray="4 4" />
          <ReferenceLine yAxisId="runway" y={RUNWAY_TARGET} strokeDasharray="2 6" />
          <Line yAxisId="share" dataKey="share" stroke="var(--color-share)" strokeWidth={2.5} dot />
          <Line yAxisId="runway" dataKey="runway" stroke="var(--color-runway)" strokeWidth={2.5} dot />
        </LineChart>
      </ChartContainer>
    </LabPanel>
  );
}
