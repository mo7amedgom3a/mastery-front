import { findLab } from "@/features/labs/model/catalog";
import type { Attempt } from "@/features/labs/model/progress-store";
import {
  behaviourStyleLabels,
  skillLabels,
  skillShortLabels,
  type BehaviourStyle,
  type HighlightTone,
  type Skill,
} from "@/features/labs/model/types";

/**
 * Turns stored lab attempts into the behaviour report shown on the insights page: per-skill
 * levels and trends, ranked gaps, timestamped observations, the behaviour compass and the
 * practice timeline. Pure functions over `Attempt[]` — no React, no storage access.
 */

export type RangeKey = "30d" | "90d" | "365d";

/** The score at which a skill counts as job-ready. */
export const READY_BENCHMARK = 75;

export const SKILLS: readonly Skill[] = [
  "communication",
  "analysis",
  "persuasion",
  "empathy",
  "decision",
  "execution",
  "strategy",
];

const RANGE_DAYS: Record<RangeKey, number> = { "30d": 30, "90d": 90, "365d": 365 };

/** Attempts recorded inside the insights window, newest first. */
export function filterAttemptsByRange(attempts: readonly Attempt[], range: RangeKey, now = new Date()): Attempt[] {
  const cutoff = now.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
  return attempts
    .filter((attempt) => new Date(attempt.at).getTime() >= cutoff)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value);

export type SkillStat = {
  skill: Skill;
  label: string;
  shortLabel: string;
  /** Average of the best attempt per lab (null when no lab exercised the skill). */
  level: number | null;
  /** Highest single dimension score seen. */
  best: number | null;
  /** Score in the most recent attempt that exercised the skill. */
  latest: number | null;
  /** Latest minus the attempt before it. */
  delta: number | null;
  /** How many labs exercised the skill. */
  labs: number;
  /** The observer's advice for the weakest dimension feeding this skill. */
  tip: string | null;
};

export type LabSummary = {
  attempts: number;
  labs: number;
  minutes: number;
  xp: number;
  badges: number;
  average: number | null;
  bestLab: { slug: string; title: string; score: number } | null;
  strongest: SkillStat | null;
  weakest: SkillStat | null;
  /** 0–100 agreement between attempts; null until there are two. */
  consistency: number | null;
};

export type Observation = {
  id: string;
  /** ISO timestamp of the attempt. */
  at: string;
  labTitle: string;
  /** The observer's own anchor ("02:45", "اليوم 4", "التشخيص"…). */
  moment: string;
  tone: HighlightTone;
  text: string;
  advice: string;
};

export type BehaviourPattern = {
  id: string;
  tone: HighlightTone;
  title: string;
  text: string;
};

export type CompassPoint = {
  slug: string;
  title: string;
  color: string;
  score: number;
  /** Communication + empathy. */
  x: number;
  /** Decision + persuasion. */
  y: number;
  quadrant: string;
};

export type HeatmapRow = {
  slug: string;
  title: string;
  color: string;
  overall: number;
  /** Skill level for this lab's best attempt; null when the lab never scored that skill. */
  scores: Record<Skill, number | null>;
};

export type TimelinePoint = {
  id: string;
  /** Short date label for the axis. */
  label: string;
  labTitle: string;
  score: number;
  weakest: number;
  weakestLabel: string;
};

export type StyleShift = {
  pre: { style: BehaviourStyle; label: string; text: string } | null;
  post: { style: BehaviourStyle; label: string; text: string } | null;
  changed: boolean;
};

export type CategoryCoverage = { name: string; attempts: number; labs: number; average: number };

export type LabInsights = {
  summary: LabSummary;
  skills: SkillStat[];
  /** Weakest first; only skills the learner has actually practised. */
  rankedSkills: SkillStat[];
  gaps: SkillStat[];
  observations: Observation[];
  patterns: BehaviourPattern[];
  compass: CompassPoint[];
  heatmap: HeatmapRow[];
  timeline: TimelinePoint[];
  styles: StyleShift;
  categories: CategoryCoverage[];
};

const shortDay = new Intl.DateTimeFormat("ar", { day: "numeric", month: "short" });

const titleOf = (slug: string) => findLab(slug)?.title ?? slug;
const colorOf = (slug: string) => findLab(slug)?.color ?? "coral";

function weakestDimension(attempt: Attempt) {
  return [...attempt.dimensions].sort((a, b) => a.score - b.score)[0] ?? null;
}

function styleOf(result: Attempt["pre"]): StyleShift["pre"] {
  if (!result?.style) return null;
  return { style: result.style, label: behaviourStyleLabels[result.style].label, text: behaviourStyleLabels[result.style].text };
}

function quadrantOf(x: number, y: number): string {
  if (x >= 50 && y >= 50) return "قيادة متوازنة";
  if (x < 50 && y >= 50) return "حسم سريع";
  if (x >= 50) return "تواصل بلا قرار";
  return "مساحة للتطوير";
}

export function buildLabInsights(attempts: readonly Attempt[]): LabInsights {
  const newestFirst = [...attempts].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Best attempt per lab: the learner's current ceiling, not the average of their warm-ups.
  const bestByLab = new Map<string, Attempt>();
  for (const attempt of newestFirst) {
    const current = bestByLab.get(attempt.slug);
    if (!current || attempt.overall > current.overall) bestByLab.set(attempt.slug, attempt);
  }
  const best = [...bestByLab.values()];

  const skills = SKILLS.map((skill): SkillStat => {
    const levels: number[] = [];
    const joints: { at: number; score: number }[] = [];
    let bestScore: number | null = null;
    let tip: string | null = null;
    let labs = 0;

    for (const attempt of best) {
      const dimensions = attempt.dimensions.filter((d) => d.skill === skill);
      if (!dimensions.length) continue;
      labs += 1;
      levels.push(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
      for (const d of dimensions) {
        bestScore = bestScore == null ? d.score : Math.max(bestScore, d.score);
        if (!tip && d.tip) tip = d.tip;
      }
    }
    for (const attempt of newestFirst) {
      const dimensions = attempt.dimensions.filter((d) => d.skill === skill);
      if (!dimensions.length) continue;
      joints.push({
        at: new Date(attempt.at).getTime(),
        score: dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
      });
    }
    const latest = joints[0] ?? null;
    const previous = joints[1] ?? null;
    return {
      skill,
      label: skillLabels[skill],
      shortLabel: skillShortLabels[skill],
      level: levels.length ? round(levels.reduce((a, b) => a + b, 0) / levels.length) : null,
      best: bestScore,
      latest: latest ? round(latest.score) : null,
      delta: latest && previous ? round(latest.score - previous.score) : null,
      labs,
      tip,
    };
  });

  const rankedSkills = skills.filter((s) => s.level != null).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const gaps = rankedSkills.filter((s) => (s.level ?? 100) < READY_BENCHMARK);

  const scores = newestFirst.map((a) => a.overall);
  const average = scores.length ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const variance = scores.length > 1 ? scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length : null;
  const consistency = variance == null ? null : round(clamp(100 - Math.sqrt(variance) * 2));

  const bestEntry = best.reduce<LabInsights["summary"]["bestLab"]>((winner, attempt) => {
    if (!winner || attempt.overall > winner.score) {
      return { slug: attempt.slug, title: titleOf(attempt.slug), score: attempt.overall };
    }
    return winner;
  }, null);

  const summary: LabSummary = {
    attempts: newestFirst.length,
    labs: bestByLab.size,
    minutes: newestFirst.reduce((sum, a) => sum + a.minutes, 0),
    xp: newestFirst.reduce((sum, a) => sum + a.xp, 0),
    badges: new Set(newestFirst.flatMap((a) => a.badges)).size,
    average,
    bestLab: bestEntry,
    strongest: rankedSkills[rankedSkills.length - 1] ?? null,
    weakest: rankedSkills[0] ?? null,
    consistency,
  };

  // One observation per scorecard highlight, newest attempt first, each paired with the
  // observer's own advice from that attempt's weakest axis.
  const observations: Observation[] = [];
  for (const attempt of newestFirst) {
    const weak = weakestDimension(attempt);
    const advice = weak?.tip ?? (weak ? `راجع محور «${weak.label}» في المحاولة القادمة.` : "");
    for (const [index, highlight] of attempt.highlights.entries()) {
      observations.push({
        id: `${attempt.id}-${index}`,
        at: attempt.at,
        labTitle: titleOf(attempt.slug),
        moment: highlight.at,
        tone: highlight.tone,
        text: highlight.text,
        advice: highlight.tone === "good" ? "" : advice,
      });
    }
  }

  const patterns: BehaviourPattern[] = [];
  const weakest = rankedSkills[0] ?? null;
  const strongest = rankedSkills[rankedSkills.length - 1] ?? null;
  if (weakest) {
    patterns.push({
      id: "weakest",
      tone: "bad",
      title: `أضعف محور: ${weakest.label}`,
      text: weakest.tip ?? `متوسطك ${weakest.level}٪ في هذا المحور. كرّر مختبرًا يغطيه لترفع الرقم.`,
    });
  }
  if (strongest && strongest.skill !== weakest?.skill && (strongest.level ?? 0) >= READY_BENCHMARK) {
    patterns.push({
      id: "strongest",
      tone: "good",
      title: `نقطة قوتك: ${strongest.label}`,
      text: `تصل إلى ${strongest.level}٪، وهذا مستوى جاهز للعمل. استثمره في السيناريوهات الأصعب.`,
    });
  }
  const latestAttempt = newestFirst[0] ?? null;
  const previousAttempt = newestFirst[1] ?? null;
  if (latestAttempt && previousAttempt) {
    const diff = latestAttempt.overall - previousAttempt.overall;
    if (Math.abs(diff) >= 4) {
      patterns.push({
        id: "trend",
        tone: diff > 0 ? "good" : "bad",
        title: diff > 0 ? "منحنى صاعد" : "تراجع في آخر محاولة",
        text:
          diff > 0
            ? `ارتفعت نتيجتك ${diff} نقاط بين آخر محاولتين. ثبّت ما نجح قبل أن تزيد الصعوبة.`
            : `انخفضت نتيجتك ${Math.abs(diff)} نقاط بين آخر محاولتين. راجع الملاحظات الحمراء قبل الإعادة.`,
      });
    }
  }
  if (consistency != null && consistency < 60) {
    patterns.push({
      id: "consistency",
      tone: "info",
      title: "أداؤك متذبذب",
      text: "الفرق بين محاولاتك كبير. الهدف الآن ليس نتيجة أعلى، بل نتيجة ثابتة في كل مرة.",
    });
  }
  const analysis = skills.find((s) => s.skill === "analysis")?.level ?? null;
  const execution = skills.find((s) => s.skill === "execution")?.level ?? null;
  if (analysis != null && execution != null && analysis - execution >= 12) {
    patterns.push({
      id: "analysis-execution",
      tone: "bad",
      title: "تحليل أقوى من التنفيذ",
      text: "تشخّص جيدًا ثم تفقد نقاطًا في التوثيق والخطوات. خصّص آخر دقيقتين من كل مختبر للـCRM والملاحظات.",
    });
  }
  const empathy = skills.find((s) => s.skill === "empathy")?.level ?? null;
  if (empathy != null && empathy < 60) {
    patterns.push({
      id: "empathy",
      tone: "bad",
      title: "التعاطف يمثّل خطرًا",
      text: "في المواقف الحساسة قد تكسب الحجة وتخسر العلاقة. ابدأ بالاستماع قبل العرض.",
    });
  }

  // A lab that scored none of an axis is left off the compass instead of being plotted at 0.
  const axisScore = (attempt: Attempt, skills: readonly Skill[]): number | null => {
    const bySkill = new Map<Skill, number>();
    for (const d of attempt.dimensions) bySkill.set(d.skill, d.score);
    const values = skills.map((skill) => bySkill.get(skill)).filter((value): value is number => value != null);
    return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };
  const compass: CompassPoint[] = [];
  for (const attempt of best) {
    const x = axisScore(attempt, ["communication", "empathy"]);
    const y = axisScore(attempt, ["decision", "persuasion"]);
    if (x == null || y == null) continue;
    compass.push({
      slug: attempt.slug,
      title: titleOf(attempt.slug),
      color: colorOf(attempt.slug),
      score: attempt.overall,
      x,
      y,
      quadrant: quadrantOf(x, y),
    });
  }

  const heatmap: HeatmapRow[] = best.map((attempt) => {
    const scores = Object.fromEntries(
      SKILLS.map((skill) => {
        const dimensions = attempt.dimensions.filter((d) => d.skill === skill);
        return [skill, dimensions.length ? round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length) : null];
      }),
    ) as Record<Skill, number | null>;
    return { slug: attempt.slug, title: titleOf(attempt.slug), color: colorOf(attempt.slug), overall: attempt.overall, scores };
  });

  const timeline: TimelinePoint[] = [...newestFirst]
    .slice(0, 12)
    .reverse()
    .map((attempt) => {
      const weak = weakestDimension(attempt);
      return {
        id: attempt.id,
        label: shortDay.format(new Date(attempt.at)),
        labTitle: titleOf(attempt.slug),
        score: attempt.overall,
        weakest: weak?.score ?? 0,
        weakestLabel: weak?.label ?? "—",
      };
    });

  const latestStyle = newestFirst.find((a) => a.pre?.style) ?? null;
  const styles: StyleShift = {
    pre: styleOf(latestStyle?.pre ?? null),
    post: styleOf(latestStyle?.post ?? null),
    changed: Boolean(latestStyle?.pre?.style && latestStyle?.post?.style && latestStyle.pre.style !== latestStyle.post.style),
  };

  const categoryMap = new Map<string, { attempts: number; labs: Set<string>; total: number }>();
  for (const attempt of newestFirst) {
    const name = attempt.categoryName || "غير مصنّف";
    const entry = categoryMap.get(name) ?? { attempts: 0, labs: new Set<string>(), total: 0 };
    entry.attempts += 1;
    entry.labs.add(attempt.slug);
    entry.total += attempt.overall;
    categoryMap.set(name, entry);
  }
  const categories: CategoryCoverage[] = [...categoryMap.entries()]
    .map(([name, entry]) => ({ name, attempts: entry.attempts, labs: entry.labs.size, average: round(entry.total / entry.attempts) }))
    .sort((a, b) => b.attempts - a.attempts || b.average - a.average);

  return { summary, skills, rankedSkills, gaps, observations, patterns, compass, heatmap, timeline, styles, categories };
}
