"use client";

import { Megaphone, RefreshCw, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, rtlXAxis, rtlYAxis, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { marketingPostQuiz, marketingPreQuiz, scoreMarketing } from "../../content/marketing";
import {
  CAMPAIGN_DAYS,
  COMPETITOR_DAYS,
  COMPETITOR_PLATFORMS,
  FATIGUE_WARNING,
  TARGET_IMPRESSIONS,
  TARGET_LIKES,
  TOTAL_BUDGET,
  ageBands,
  audienceSize,
  cities,
  ctas,
  currentFrequency,
  headlines,
  interests,
  normaliseSplit,
  platforms,
  simulateDay,
  sizeVerdict,
  spentSoFar,
  startCampaign,
  suggestedBudget,
  totals,
  visuals,
  type AdPlan,
  type Bid,
  type Campaign,
  type Creative,
  type Pacing,
  type Platform,
} from "../../model/ad-market";
import { finishAttempt } from "../../model/progress-store";
import { usePracticeClock } from "../../model/use-practice-clock";
import type { LabDefinition, LabResult, QuizResult } from "../../model/types";
import { LabPanel, OptionCard, Stat } from "../bits";
import { BriefingCard } from "../briefing-card";
import { LabShell, ObjectivesHud } from "../lab-shell";
import { LabScorecard } from "../scorecard";
import { formatTip } from "./format-tips";
import { PlatformPreview } from "./platform-previews";
import { SkillQuiz } from "../skill-quiz";

type Stage = "brief" | "pre" | "audience" | "creative" | "budget" | "run" | "post" | "debrief";
const stepOf: Record<Stage, number> = { brief: 0, pre: 0, audience: 1, creative: 2, budget: 3, run: 4, post: 5, debrief: 5 };
const MAX_REFRESHES = 2;

const platformLabel = (id: Platform) => platforms.find((p) => p.id === id)?.label ?? id;
const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
const money = (n: number) => `${n.toFixed(2)}$`;

const initialPlan: AdPlan = {
  city: "riyadh",
  ages: [],
  interests: [],
  platforms: [],
  creative: { headline: "h-generic", visual: "v-logo", cta: "c-buy" },
  bid: "reach",
  pacing: "even",
  split: {},
};

// ---------- phase: audience ----------

function AudienceStep({ plan, setPlan, onNext }: { plan: AdPlan; setPlan: (p: AdPlan) => void; onNext: () => void }) {
  const size = audienceSize(plan);
  const verdict = sizeVerdict(size);
  const ready = plan.ages.length > 0 && plan.platforms.length > 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <LabPanel title="من سيشاهد إعلانك؟" subtitle="ابنِ الجمهور: المدينة، العمر، الاهتمامات، والمنصات.">
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">المدينة</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {cities.map((c) => (
              <OptionCard key={c.id} selected={plan.city === c.id} onSelect={() => setPlan({ ...plan, city: c.id })} title={c.label} detail={c.detail} />
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">الفئة العمرية</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ageBands.map((a) => (
              <OptionCard key={a.id} multi selected={plan.ages.includes(a.id)} onSelect={() => setPlan({ ...plan, ages: toggle(plan.ages, a.id) })} title={<span dir="ltr">{a.label}</span>} />
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">الاهتمامات (اختياري)</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {interests.map((i) => (
              <OptionCard key={i.id} multi selected={plan.interests.includes(i.id)} onSelect={() => setPlan({ ...plan, interests: toggle(plan.interests, i.id) })} title={i.label} />
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">المنصات</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {platforms.map((p) => (
              <OptionCard
                key={p.id}
                multi
                selected={plan.platforms.includes(p.id)}
                onSelect={() => {
                  const next = toggle(plan.platforms, p.id);
                  setPlan({ ...plan, platforms: next, split: normaliseSplit({}, next) });
                }}
                title={p.label}
                detail={`تكلفة الألف ≈ ${p.cpm.toFixed(1)}$`}
              />
            ))}
          </div>
        </fieldset>
      </LabPanel>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
        <LabPanel title={<span className="inline-flex items-center gap-2"><Users className="size-5 text-coral" aria-hidden /> حجم الجمهور التقديري</span>}>
          <p className="m-0 text-3xl font-bold tabular-nums">{formatNumber(size)}</p>
          <p
            className={cn(
              "m-0 rounded-photo p-3 text-sm leading-6 text-ink",
              !ready ? "bg-surface-alt text-fg" : verdict === "good" ? "bg-green" : verdict === "narrow" ? "bg-pink" : "bg-yellow",
            )}
          >
            {!ready
              ? "اختر فئة عمرية ومنصة واحدة على الأقل."
              : verdict === "good"
                ? "حجم مناسب لميزانية 100$: وصول كافٍ دون تكرار مفرط."
                : verdict === "narrow"
                  ? "ضيق جدًا: سيتكرر الإعلان على نفس الأشخاص وترتفع التكلفة."
                  : "واسع جدًا: ستصرف على أشخاص بعيدين عن المحمصة."}
          </p>
        </LabPanel>
        <Button size="lg" block disabled={!ready} onClick={onNext}>
          التالي: الإعلان
        </Button>
      </aside>
    </div>
  );
}

// ---------- phase: creative ----------

function CreativeStep({ plan, setPlan, onNext }: { plan: AdPlan; setPlan: (p: AdPlan) => void; onNext: () => void }) {
  // Nothing is preselected: a default would read as a recommendation.
  const [chosen, setChosen] = useState<(keyof Creative)[]>([]);
  const set = (key: keyof Creative, patch: Partial<Creative>) => {
    setChosen((current) => (current.includes(key) ? current : [...current, key]));
    setPlan({ ...plan, creative: { ...plan.creative, ...patch } });
  };
  const ready = chosen.length === 3;
  const [preview, setPreview] = useState<Platform>(plan.platforms[0] ?? "instagram");
  const togglePlatform = (id: Platform) => {
    const next = toggle(plan.platforms, id);
    if (!next.length) return;
    setPlan({ ...plan, platforms: next, split: normaliseSplit({}, next) });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <LabPanel title="صمّم الإعلان" subtitle="العنوان والصورة ودعوة الإجراء. كل تركيبة تتفاعل بشكل مختلف حسب الجمهور والمنصة.">
        {(
          [
            ["العنوان", headlines, "headline"],
            ["المحتوى المرئي", visuals, "visual"],
            ["دعوة الإجراء", ctas, "cta"],
          ] as const
        ).map(([label, options, key]) => (
          <fieldset key={key} className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">{label}</legend>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => (
                <OptionCard
                  key={o.id}
                  selected={chosen.includes(key) && plan.creative[key] === o.id}
                  onSelect={() => set(key, { [key]: o.id } as Partial<Creative>)}
                  title={o.label}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </LabPanel>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
        <LabPanel title="كيف سيظهر إعلانك؟" subtitle="اختر المنصة لترى الإعلان داخل واجهتها.">
          <div role="tablist" aria-label="المنصة" className="flex flex-wrap gap-1.5">
            {platforms.map((p) => {
              const inCampaign = plan.platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={preview === p.id}
                  onClick={() => setPreview(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition-colors",
                    preview === p.id ? "border-accent bg-accent font-semibold text-on-accent" : "border-line hover:border-line-strong",
                  )}
                >
                  {inCampaign ? <span className="size-1.5 rounded-full bg-green" aria-label="في حملتك" /> : null}
                  {p.label}
                </button>
              );
            })}
          </div>
          {ready ? (
            <>
              <PlatformPreview platform={preview} creative={plan.creative} />
              {(() => {
                const tip = formatTip(preview, plan.creative.visual);
                return (
                  <p className={cn("m-0 rounded-photo p-3 text-[13px] leading-6 text-ink", tip.tone === "good" ? "bg-green" : "bg-yellow")}>
                    {tip.text}
                  </p>
                );
              })()}
            </>
          ) : (
            <p className="m-0 flex h-[580px] items-center justify-center rounded-[32px] border border-dashed border-line p-6 text-center text-sm leading-6 text-fg-muted">
              اختر العنوان والمحتوى المرئي ودعوة الإجراء لتظهر معاينة الإعلان على المنصة.
            </p>
          )}
          <Button
            variant={plan.platforms.includes(preview) ? "secondary" : "soft"}
            block
            disabled={plan.platforms.includes(preview) && plan.platforms.length === 1}
            onClick={() => togglePlatform(preview)}
          >
            {plan.platforms.includes(preview) ? `أزل ${platformLabel(preview)} من الحملة` : `أضف ${platformLabel(preview)} للحملة`}
          </Button>
        </LabPanel>
        <Button size="lg" block disabled={!ready} onClick={onNext}>
          التالي: الميزانية
        </Button>
      </aside>
    </div>
  );
}

// ---------- phase: budget ----------

function SplitSliders({
  allowed,
  split,
  onChange,
}: {
  allowed: readonly Platform[];
  split: Partial<Record<Platform, number>>;
  onChange: (split: Partial<Record<Platform, number>>) => void;
}) {
  const normal = normaliseSplit(split, allowed);
  return (
    <div className="flex flex-col gap-3">
      {allowed.map((p) => (
        <label key={p} className="flex flex-col gap-1">
          <span className="flex justify-between text-[13px]">
            <span>{platformLabel(p)}</span>
            <span className="font-semibold tabular-nums">{Math.round(normal[p] ?? 0)}٪</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(split[p] ?? 0)}
            onChange={(e) => onChange({ ...split, [p]: Number(e.target.value) })}
            className="accent-[var(--accent)]"
            aria-label={`حصة ${platformLabel(p)}`}
          />
        </label>
      ))}
    </div>
  );
}

function BudgetStep({ plan, setPlan, onNext }: { plan: AdPlan; setPlan: (p: AdPlan) => void; onNext: () => void }) {
  // Walk the pacing to show the planned budget per day.
  const perDay: number[] = [];
  let remaining = TOTAL_BUDGET;
  for (let day = 1; day <= CAMPAIGN_DAYS; day++) {
    const amount = suggestedBudget(plan.pacing, day, remaining);
    perDay.push(amount);
    remaining -= amount;
  }
  const max = Math.max(...perDay);
  const pacings: { id: Pacing; label: string; detail: string }[] = [
    { id: "even", label: "متساوٍ", detail: "نفس المبلغ كل يوم" },
    { id: "front", label: "مركّز في البداية", detail: "انطلاقة قوية ثم تهدئة" },
    { id: "back", label: "مركّز في النهاية", detail: "تمهيد ثم دفعة أخيرة" },
  ];
  const bids: { id: Bid; label: string; detail: string }[] = [
    { id: "reach", label: "المزايدة على الوصول", detail: "ظهور أرخص، تفاعل أقل" },
    { id: "engagement", label: "المزايدة على التفاعل", detail: "ظهور أغلى قليلًا، يصل لمن يتفاعل" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LabPanel title="الاستراتيجية" subtitle="كيف تُنفق 100$؟">
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">استراتيجية المزايدة</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {bids.map((b) => (
              <OptionCard key={b.id} selected={plan.bid === b.id} onSelect={() => setPlan({ ...plan, bid: b.id })} title={b.label} detail={b.detail} />
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">توزيع الميزانية على الأيام</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
            {pacings.map((p) => (
              <OptionCard key={p.id} selected={plan.pacing === p.id} onSelect={() => setPlan({ ...plan, pacing: p.id })} title={p.label} detail={p.detail} />
            ))}
          </div>
        </fieldset>
        <div className="flex h-24 items-end gap-1.5" aria-hidden>
          {perDay.map((amount, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-[4px] bg-coral" style={{ height: `${(amount / max) * 64}px` }} />
              <span className="text-[11px] text-fg-muted tabular-nums">{i + 1}</span>
            </div>
          ))}
        </div>
      </LabPanel>
      <LabPanel title="التوزيع على المنصات" subtitle="حصة كل منصة من ميزانية اليوم. يمكنك تعديلها بين الأيام.">
        <SplitSliders allowed={plan.platforms} split={plan.split} onChange={(split) => setPlan({ ...plan, split })} />
        <Button size="lg" block onClick={onNext}>
          أطلق الحملة
        </Button>
      </LabPanel>
    </div>
  );
}

// ---------- phase: run ----------

const chartConfig = {
  impressions: { label: "الظهور التراكمي", color: kitColor("coral") },
  likes: { label: "التفاعل التراكمي", color: kitColor("sky") },
} satisfies ChartConfig;

function RunStep({ campaign, onRunDay, onFinish }: { campaign: Campaign; onRunDay: (decision: { budget: number; split: Partial<Record<Platform, number>>; refresh: boolean }) => void; onFinish: () => void }) {
  const day = campaign.days.length + 1;
  const done = day > CAMPAIGN_DAYS;
  const spent = spentSoFar(campaign);
  const remaining = Math.max(0, Math.round((TOTAL_BUDGET - spent) * 100) / 100);
  const suggested = done ? 0 : suggestedBudget(campaign.plan.pacing, day, remaining);
  const [budget, setBudget] = useState<number | null>(null);
  const [split, setSplit] = useState<Partial<Record<Platform, number>> | null>(null);
  const [refresh, setRefresh] = useState(false);
  const t = totals(campaign);
  const frequency = currentFrequency(campaign);
  const refreshesUsed = campaign.days.filter((d) => d.refreshed).length;
  const competitorSoon = !done && (COMPETITOR_DAYS.includes(day) || day === COMPETITOR_DAYS[0] - 1);
  const dayBudget = Math.min(budget ?? suggested, remaining);
  const daySplit = split ?? campaign.days.at(-1)?.split ?? campaign.plan.split;

  const rows = campaign.days.map((d, i) => {
    const sofar = campaign.days.slice(0, i + 1);
    return {
      day: `يوم ${d.day}`,
      impressions: sofar.reduce((sum, x) => sum + x.impressions, 0),
      likes: sofar.reduce((sum, x) => sum + x.likes, 0),
    };
  });

  const run = () => {
    onRunDay({ budget: dayBudget, split: daySplit, refresh });
    setBudget(null);
    setRefresh(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="المنفق" value={money(spent)} hint={`المتبقي ${money(remaining)}`} />
        <Stat label="الظهور" value={formatNumber(t.impressions)} hint={`الهدف ${formatNumber(TARGET_IMPRESSIONS)}`} tone={t.impressions >= TARGET_IMPRESSIONS ? "good" : undefined} />
        <Stat label="التفاعل" value={formatNumber(t.likes)} hint={`الهدف ${formatNumber(TARGET_LIKES)}`} tone={t.likes >= TARGET_LIKES ? "good" : undefined} />
        <Stat label="تكلفة الألف ظهور" value={t.impressions ? money(t.cpm) : "—"} hint="CPM" />
        <Stat label="التكرار" value={frequency.toFixed(2)} hint={frequency >= FATIGUE_WARNING ? "مرتفع: تعب إعلاني" : "طبيعي"} tone={frequency >= FATIGUE_WARNING ? "bad" : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <LabPanel title={<span className="inline-flex items-center gap-2"><TrendingUp className="size-5 text-coral" aria-hidden /> لوحة أداء الحملة</span>}>
          {rows.length ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
              <LineChart data={rows} margin={{ top: 8, left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" {...rtlXAxis} />
                <YAxis yAxisId="imp" {...rtlYAxis} width={44} domain={[0, (max: number) => Math.max(max, TARGET_IMPRESSIONS) * 1.05]} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <YAxis yAxisId="likes" orientation="left" domain={[0, (max: number) => Math.max(max, TARGET_LIKES) * 1.05]} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => formatNumber(v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine yAxisId="imp" y={TARGET_IMPRESSIONS} strokeDasharray="4 4" />
                <ReferenceLine yAxisId="likes" y={TARGET_LIKES} strokeDasharray="2 6" />
                <Line yAxisId="imp" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2.5} dot />
                <Line yAxisId="likes" dataKey="likes" stroke="var(--color-likes)" strokeWidth={2.5} dot />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="m-0 flex h-64 items-center justify-center rounded-photo border border-dashed border-line text-sm text-fg-muted">
              شغّل اليوم الأول لترى النتائج.
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-[12px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-coral" /> الظهور (المحور الأيمن)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-sky" /> التفاعل (المحور الأيسر)</span>
            <span>الخطوط المتقطعة: الأهداف</span>
          </div>
          {campaign.days.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-[13px]">
                <thead className="text-fg-muted">
                  <tr className="border-b border-line text-start">
                    {["اليوم", "الإنفاق", "الظهور", "التفاعل", "CPM", "ملاحظة"].map((h) => (
                      <th key={h} className="py-2 text-start font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaign.days.map((d) => (
                    <tr key={d.day} className="border-b border-line/60">
                      <td className="py-1.5 tabular-nums">{d.day}</td>
                      <td className="tabular-nums">{money(d.spend)}</td>
                      <td className="tabular-nums">{formatNumber(d.impressions)}</td>
                      <td className="tabular-nums">{formatNumber(d.likes)}</td>
                      <td className={cn("tabular-nums", d.competitor && "text-pink")}>{money(d.cpm)}</td>
                      <td className="text-fg-muted">
                        {[d.competitor ? "عرض المنافس" : null, d.refreshed ? "إعلان جديد" : null].filter(Boolean).join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </LabPanel>

        <LabPanel title={done ? "انتهت الحملة" : `قرارات اليوم ${day} من ${CAMPAIGN_DAYS}`}>
          {done ? (
            <>
              <p className="m-0 text-sm leading-7 text-fg-muted">
                {t.impressions >= TARGET_IMPRESSIONS && t.likes >= TARGET_LIKES
                  ? "حققت الهدفين! لنرَ تقييم المراقب لطريقة وصولك."
                  : "انتهت الأيام السبعة. لنرَ ما الذي كان يمكن فعله بشكل مختلف."}
              </p>
              <Button size="lg" block onClick={onFinish}>
                أنهِ الحملة واعرض التقييم
              </Button>
            </>
          ) : (
            <>
              {competitorSoon ? (
                <p className="m-0 flex items-start gap-2 rounded-photo bg-yellow p-3 text-[13px] leading-6 text-ink">
                  <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {COMPETITOR_DAYS.includes(day)
                    ? `منافس كبير يطلق عرضًا الآن على ${COMPETITOR_PLATFORMS.map(platformLabel).join(" و")}: الأسعار مرتفعة هناك.`
                    : `أخبار السوق: منافس كبير سيطلق عرضًا على ${COMPETITOR_PLATFORMS.map(platformLabel).join(" و")} غدًا لمدة يومين.`}
                </p>
              ) : null}
              {frequency >= FATIGUE_WARNING ? (
                <p className="m-0 flex items-start gap-2 rounded-photo bg-pink p-3 text-[13px] leading-6 text-ink">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  الجمهور شاهد الإعلان مرات كثيرة (التكرار {frequency.toFixed(1)}). التفاعل سيتراجع والتكلفة سترتفع.
                </p>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-[13px]">
                  <span>ميزانية اليوم</span>
                  <span className="font-semibold tabular-nums">{money(dayBudget)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, Math.floor(remaining * 2) / 2)}
                  step={0.5}
                  value={dayBudget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="accent-[var(--accent)]"
                  aria-label="ميزانية اليوم"
                />
                <span className="text-[12px] text-fg-muted">المقترح حسب خطتك: {money(suggested)} · 0 = إيقاف مؤقت</span>
              </label>
              <SplitSliders allowed={campaign.plan.platforms} split={daySplit} onChange={setSplit} />
              <label className="ma-check text-sm">
                <input
                  type="checkbox"
                  checked={refresh}
                  disabled={refreshesUsed >= MAX_REFRESHES}
                  onChange={(e) => setRefresh(e.target.checked)}
                />
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="size-4" aria-hidden /> أطلق نسخة جديدة من الإعلان ({MAX_REFRESHES - refreshesUsed} متبقية)
                </span>
              </label>
              <Button size="lg" block onClick={run}>
                شغّل اليوم {day}
              </Button>
            </>
          )}
        </LabPanel>
      </div>
    </div>
  );
}

// ---------- lab ----------

export function MarketingLab({ lab }: { lab: LabDefinition }) {
  const [stage, setStage] = useState<Stage>("brief");
  const [attempt, setAttempt] = useState(0);
  const [pre, setPre] = useState<QuizResult | null>(null);
  const [plan, setPlan] = useState<AdPlan>(initialPlan);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);

  const clock = usePracticeClock();

  const restart = () => {
    setStage("brief");
    setAttempt((n) => n + 1);
    clock.reset();
    setPre(null);
    setPlan(initialPlan);
    setCampaign(null);
    setResult(null);
  };

  const finish = (post: QuizResult) => {
    if (!campaign) return;
    const { scorecard, targetMet } = scoreMarketing(campaign);
    setResult(finishAttempt(lab.slug, scorecard, { marketingTargetMet: targetMet }, pre, post, clock.elapsedSeconds()));
    setStage("debrief");
  };

  const t = campaign ? totals(campaign) : null;
  const hud =
    stage === "run" && t && campaign ? (
      <ObjectivesHud
        items={[
          { label: "الظهور", value: `${formatNumber(t.impressions)} / ${formatNumber(TARGET_IMPRESSIONS)}`, done: t.impressions >= TARGET_IMPRESSIONS },
          { label: "التفاعل", value: `${formatNumber(t.likes)} / ${formatNumber(TARGET_LIKES)}`, done: t.likes >= TARGET_LIKES },
          { label: "الميزانية", value: `${money(t.spend)} / ${TOTAL_BUDGET}$` },
          { label: "اليوم", value: `${Math.min(campaign.days.length + 1, CAMPAIGN_DAYS)} / ${CAMPAIGN_DAYS}` },
        ]}
      />
    ) : null;

  return (
    <LabShell key={attempt} lab={lab} step={stepOf[stage]} hud={hud}>
      {stage === "brief" ? <BriefingCard lab={lab} onStart={() => setStage("pre")} /> : null}
      {stage === "pre" ? (
        <SkillQuiz
          mode="pre"
          questions={marketingPreQuiz}
          onDone={(r) => {
            setPre(r);
            setStage("audience");
          }}
        />
      ) : null}
      {stage === "audience" ? <AudienceStep plan={plan} setPlan={setPlan} onNext={() => setStage("creative")} /> : null}
      {stage === "creative" ? <CreativeStep plan={plan} setPlan={setPlan} onNext={() => setStage("budget")} /> : null}
      {stage === "budget" ? (
        <BudgetStep
          plan={plan}
          setPlan={setPlan}
          onNext={() => {
            const ready = { ...plan, split: normaliseSplit(plan.split, plan.platforms) };
            setPlan(ready);
            setCampaign(startCampaign(ready));
            setStage("run");
          }}
        />
      ) : null}
      {stage === "run" && campaign ? (
        <RunStep
          campaign={campaign}
          onRunDay={(decision) =>
            setCampaign((c) => (c ? simulateDay(c, { ...decision, creative: c.plan.creative }, attempt + 11) : c))
          }
          onFinish={() => setStage("post")}
        />
      ) : null}
      {stage === "post" ? <SkillQuiz mode="post" questions={marketingPostQuiz} onDone={finish} /> : null}
      {stage === "debrief" && result ? <LabScorecard lab={lab} result={result} onRetry={restart} /> : null}
    </LabShell>
  );
}
