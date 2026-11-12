"use client";

import { Award, CircleAlert, CircleCheck, Info, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import { CountUp } from "@/components/motion/count-up";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, type ChartConfig } from "@/components/ui/chart";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { nextLab } from "../model/catalog";
import { badgeInfo } from "../model/progress-store";
import { behaviourStyleLabels, type HighlightTone, type LabDefinition, type LabResult } from "../model/types";
import { LabPanel } from "./bits";
import { LabRecommendations } from "./lab-recommendations";

const chartConfig = { score: { label: "الدرجة", color: kitColor("coral") } } satisfies ChartConfig;

const toneIcon: Record<HighlightTone, typeof Info> = { good: CircleCheck, bad: CircleAlert, info: Info };
const toneClass: Record<HighlightTone, string> = { good: "text-green", bad: "text-pink", info: "text-sky" };

function shortLabel(label: string): string {
  return label.length > 14 ? `${label.slice(0, 13)}…` : label;
}

/** The observer's debrief: overall score, radar, dimensions, highlights, tips, quiz delta and rewards. */
export function LabScorecard({ lab, result, onRetry }: { lab: LabDefinition; result: LabResult; onRetry: () => void }) {
  const { scorecard, xp, newBadges, pre, post } = result;
  const recommended = nextLab(lab.slug);
  const celebrate = newBadges.length > 0 || scorecard.overall >= 80;

  useEffect(() => {
    if (!celebrate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (!cancelled) confetti({ particleCount: 120, spread: 75, origin: { y: 0.35 } });
    });
    return () => {
      cancelled = true;
    };
  }, [celebrate]);

  const rows = scorecard.dimensions.map((d) => ({ name: shortLabel(d.label), fullName: d.label, score: d.score }));

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 rounded-panel border border-line bg-surface p-5 md:grid-cols-[auto_1fr] md:p-7">
        <div className="flex flex-col items-center justify-center gap-2 text-center md:min-w-56">
          <span className="text-[13px] font-semibold text-fg-muted">النتيجة الكلية</span>
          <span className="text-6xl leading-none font-bold tabular-nums">
            <CountUp value={scorecard.overall} duration={1200} />
          </span>
          <span className="text-sm text-fg-muted">من 100</span>
          <span
            className={cn(
              "mt-1 rounded-full px-3 py-1 text-sm font-bold text-ink",
              scorecard.readiness === "متميّز" ? "bg-green" : scorecard.readiness === "جاهز" ? "bg-yellow" : "bg-pink",
            )}
          >
            المستوى: {scorecard.readiness}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="m-0 text-lg leading-8 font-bold">{scorecard.verdict}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-photo bg-surface-alt p-3">
              <Sparkles className="size-6 text-yellow" aria-hidden />
              <div className="flex flex-col">
                <span className="text-[12px] text-fg-muted">نقاط الخبرة</span>
                <span dir="ltr" className="text-end text-lg font-bold tabular-nums">+{formatNumber(xp)} XP</span>
              </div>
            </div>
            {pre && post ? (
              <div className="flex items-center gap-3 rounded-photo bg-surface-alt p-3">
                <TrendingUp className="size-6 text-green" aria-hidden />
                <div className="flex flex-col">
                  <span className="text-[12px] text-fg-muted">قبل ← بعد التجربة</span>
                  <span className="text-lg font-bold tabular-nums">
                    {pre.percent}٪ ← {post.percent}٪
                  </span>
                </div>
              </div>
            ) : null}
            {pre?.style ? (
              <div className="flex flex-col gap-0.5 rounded-photo bg-surface-alt p-3">
                <span className="text-[12px] text-fg-muted">نمطك السلوكي</span>
                <span className="text-lg font-bold">{behaviourStyleLabels[pre.style].label}</span>
                <span className="text-[12px] leading-5 text-fg-muted">{behaviourStyleLabels[pre.style].text}</span>
              </div>
            ) : null}
          </div>
          {newBadges.length ? (
            <div className="flex flex-wrap gap-2" aria-label="شارات جديدة">
              {newBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1 text-sm font-bold text-ink">
                  <Award className="size-4" aria-hidden /> {badgeInfo[badge].label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <LabPanel title="خريطة الأداء" subtitle="تقييم المراقب على كل محور">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-sm">
            <RadarChart data={rows} outerRadius="62%">
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName} />} />
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.35} stroke="var(--color-score)" strokeWidth={2} />
            </RadarChart>
          </ChartContainer>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {scorecard.dimensions.map((d) => (
              <li key={d.key} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-fg-muted">{d.label}</span>
                  <span className="font-semibold tabular-nums">{d.score}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={cn("h-full rounded-full", d.score >= 75 ? "bg-green" : d.score >= 50 ? "bg-yellow" : "bg-pink")}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </LabPanel>

        <div className="flex flex-col gap-6">
          {scorecard.strengths.length ? (
            <LabPanel title="نقاط قوتك">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {scorecard.strengths.map((text) => (
                  <li key={text} className="flex items-start gap-2 text-sm leading-7">
                    <CircleCheck className="mt-1.5 size-4 shrink-0 text-green" aria-hidden /> {text}
                  </li>
                ))}
              </ul>
            </LabPanel>
          ) : null}
          <LabPanel title={scorecard.tips.length ? "خطوات لتتحسن" : "الخطوة التالية"}>
            {scorecard.tips.length ? null : (
              <p className="m-0 text-sm leading-7 text-fg-muted">أداؤك قوي على كل المحاور. جرّب مختبرًا آخر لتوسّع ملفك المهاري.</p>
            )}
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {scorecard.tips.map((text, index) => (
                <li key={text} className="flex items-start gap-3 text-sm leading-7">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-on-accent">
                    {index + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </LabPanel>
          <LabPanel title="لحظات فارقة" subtitle="ما رصده المراقب أثناء المحاكاة">
            <ul className="m-0 flex max-h-80 list-none flex-col gap-2 overflow-y-auto p-0">
              {scorecard.highlights.map((h, index) => {
                const Icon = toneIcon[h.tone];
                return (
                  <li key={`${h.at}-${index}`} className="flex items-start gap-2 text-sm leading-6">
                    <Icon className={cn("mt-1 size-4 shrink-0", toneClass[h.tone])} aria-hidden />
                    <span className="shrink-0 font-semibold text-fg-muted tabular-nums">{h.at}</span>
                    <span>{h.text}</span>
                  </li>
                );
              })}
            </ul>
          </LabPanel>
        </div>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-surface p-5">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-fg-muted">المختبر المقترح التالي</span>
          <span className="font-bold">{recommended.title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden /> أعد المحاولة
          </Button>
          <ButtonLink href={routes.lab(recommended.slug)} variant="primary">
            ابدأ المختبر التالي
          </ButtonLink>
          <ButtonLink href={routes.labs} variant="ghost">
            كل المختبرات
          </ButtonLink>
        </div>
      </section>

      <LabRecommendations lab={lab} />
    </div>
  );
}
