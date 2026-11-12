"use client";

import { Award, Clock, Lock, Sparkles, Trophy } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, type ChartConfig } from "@/components/ui/chart";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { labs } from "../model/catalog";
import { badgeInfo, bestScore, skillProfile, useLabsHydrated, useLabsProgress, type Attempt } from "../model/progress-store";
import { skillLabels, skillShortLabels, type BadgeId, type LabDefinition, type Skill } from "../model/types";
import { Pill } from "./bits";

/**
 * Shared pieces of the learner's lab progress (XP, completed labs, badges, skill profile, lab
 * cards), used by the labs hub and the student dashboard. Progress lives in localStorage, so the
 * server render shows the empty state and the real numbers appear after hydration.
 */

export const allBadges = Object.keys(badgeInfo) as BadgeId[];

export type LabsSnapshot = { attempts: Attempt[]; xp: number; badges: BadgeId[]; completed: number; hydrated: boolean };

export function useLabsSnapshot(): LabsSnapshot {
  const hydrated = useLabsHydrated();
  const attempts = useLabsProgress((s) => s.attempts);
  const xp = useLabsProgress((s) => s.xp);
  const badges = useLabsProgress((s) => s.badges);
  if (!hydrated) return { attempts: [], xp: 0, badges: [], completed: 0, hydrated };
  return { attempts, xp, badges, completed: new Set(attempts.map((a) => a.slug)).size, hydrated };
}

function Tile({ icon: Icon, iconClass, label, value }: { icon?: typeof Sparkles; iconClass?: string; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-panel border border-line bg-surface p-4">
      <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
        {Icon ? <Icon className={cn("size-4", iconClass)} aria-hidden /> : null} {label}
      </span>
      <span dir="ltr" className="text-end text-2xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}

/** XP, completed labs, badges and attempts. */
export function LabStatTiles({ snapshot, showAttempts = true }: { snapshot: LabsSnapshot; showAttempts?: boolean }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", showAttempts ? "md:grid-cols-4" : "md:grid-cols-3")}>
      <Tile icon={Sparkles} iconClass="text-yellow" label="نقاط الخبرة" value={`${formatNumber(snapshot.xp)} XP`} />
      <Tile icon={Trophy} iconClass="text-coral" label="مختبرات مكتملة" value={`${snapshot.completed} / ${labs.length}`} />
      <Tile icon={Award} iconClass="text-green" label="الشارات" value={`${snapshot.badges.length} / ${allBadges.length}`} />
      {showAttempts ? <Tile label="المحاولات" value={String(snapshot.attempts.length)} /> : null}
    </div>
  );
}

const radarConfig = { score: { label: "المستوى", color: kitColor("coral") } } satisfies ChartConfig;

/** Best attempt per lab, averaged per skill axis. */
export function SkillRadar({ attempts, className }: { attempts: readonly Attempt[]; className?: string }) {
  if (!attempts.length) {
    return (
      <p className="m-0 flex min-h-48 items-center justify-center rounded-photo border border-dashed border-line p-5 text-center text-sm leading-6 text-fg-muted">
        أكمل أول مختبر ليظهر ملفك المهاري هنا.
      </p>
    );
  }
  const profile = skillProfile(attempts);
  const rows = (Object.keys(skillLabels) as Skill[]).map((skill) => ({ name: skillShortLabels[skill], fullName: skillLabels[skill], score: profile[skill] ?? 0 }));
  return (
    <ChartContainer config={radarConfig} className={cn("mx-auto aspect-square w-full max-w-sm", className)}>
      <RadarChart data={rows} outerRadius="66%">
        <ChartTooltip content={<ChartTooltipContent hideIndicator labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName} />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.35} stroke="var(--color-score)" strokeWidth={2} />
      </RadarChart>
    </ChartContainer>
  );
}

/** Earned badges as tags, then how many are still locked. */
export function BadgeTags({ badges }: { badges: readonly BadgeId[] }) {
  const locked = allBadges.length - badges.length;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="الشارات">
      {badges.map((badge) => (
        <li key={badge} title={badgeInfo[badge].text} className="inline-flex items-center gap-1.5 rounded-chip bg-yellow px-2.5 py-1 text-[13px] font-bold text-ink">
          <Award className="size-4" aria-hidden /> {badgeInfo[badge].label}
        </li>
      ))}
      {locked > 0 ? (
        <li className="inline-flex items-center gap-1.5 rounded-chip border border-dashed border-line px-2.5 py-1 text-[13px] text-fg-muted">
          <Lock className="size-3.5" aria-hidden /> {badges.length ? `${locked} شارات أخرى` : `${locked} شارات بانتظارك`}
        </li>
      ) : null}
    </ul>
  );
}

/** Every badge with its rule; earned ones highlighted. */
export function BadgeGrid({ badges }: { badges: readonly BadgeId[] }) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
      {allBadges.map((badge) => {
        const earned = badges.includes(badge);
        return (
          <li key={badge} className={cn("flex items-start gap-3 rounded-photo border p-3", earned ? "border-yellow bg-yellow/10" : "border-line opacity-70")}>
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", earned ? "bg-yellow text-ink" : "bg-surface-alt text-fg-muted")}>
              {earned ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">{badgeInfo[badge].label}</span>
              <span className="text-[12px] leading-5 text-fg-muted">{badgeInfo[badge].text}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A lab's card: category, title, pitch, length, difficulty, skills and best score. */
export function LabCard({ lab, attempts, headingLevel = "h3" }: { lab: LabDefinition; attempts: readonly Attempt[]; headingLevel?: "h3" | "h4" }) {
  const best = bestScore(attempts, lab.slug);
  const Heading = headingLevel;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface">
      <div className={cn("flex flex-col gap-2 p-5 text-ink", brandBg[lab.color])}>
        <span className="text-[13px] font-semibold">{lab.categoryName}</span>
        <Heading className="m-0 text-xl leading-8 font-bold">{lab.title}</Heading>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="m-0 text-sm leading-7 text-fg-muted">{lab.tagline}</p>
        <div className="flex flex-wrap gap-1.5">
          <Pill>
            <Clock className="size-3.5" aria-hidden /> {lab.minutes} د
          </Pill>
          <Pill>{lab.difficulty}</Pill>
          {lab.skills.slice(0, 2).map((skill) => (
            <Pill key={skill}>{skillLabels[skill]}</Pill>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-[13px] text-fg-muted">
            {best == null ? (
              "لم تجرّبه بعد"
            ) : (
              <>
                أفضل نتيجة: <strong className="text-fg tabular-nums">{best}</strong>
              </>
            )}
          </span>
          <ButtonLink href={routes.lab(lab.slug)} size="sm">
            {best == null ? "ابدأ" : "أعد المحاولة"}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

/**
 * Labs to suggest next: untried ones first (catalog order, varied categories), then the weakest
 * best scores to improve.
 */
export function suggestedLabs(attempts: readonly Attempt[], count: number): LabDefinition[] {
  const untried = labs.filter((lab) => bestScore(attempts, lab.slug) == null);
  const seen = new Set<string>();
  const varied = [...untried.filter((lab) => !seen.has(lab.categoryName) && seen.add(lab.categoryName)), ...untried];
  const retry = labs
    .filter((lab) => bestScore(attempts, lab.slug) != null)
    .sort((a, b) => (bestScore(attempts, a.slug) ?? 0) - (bestScore(attempts, b.slug) ?? 0));
  return [...new Set([...varied, ...retry])].slice(0, count);
}
