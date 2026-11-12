/**
 * A deterministic, seeded ad-market simulator for the Marketing Ad Lab. Pure functions only:
 * the same plan, decisions and seed always produce the same campaign.
 *
 * Model (per day, per platform):
 * - CPM = platform base × bid strategy × audience-size pressure × fatigue × competition event.
 * - Impressions = spend / CPM × 1000.
 * - Engagement rate (likes / impression) = base × audience fit × creative quality × platform × bid.
 * - Fatigue grows with frequency (impressions since the last creative refresh / audience size).
 * - Days 4–5: a competitor promotion raises CPM on Instagram and TikTok.
 */

export const TOTAL_BUDGET = 100;
export const CAMPAIGN_DAYS = 7;
export const TARGET_IMPRESSIONS = 50_000;
export const TARGET_LIKES = 2_000;
export const COMPETITOR_DAYS: readonly number[] = [4, 5];
/** Share of the audience a week-long campaign can realistically reach; frequency is measured against it. */
export const REACHABLE_SHARE = 0.1;
/** Frequency above which the dashboard warns about ad fatigue. */
export const FATIGUE_WARNING = 1.2;
export const COMPETITOR_PLATFORMS: readonly Platform[] = ["instagram", "tiktok"];

export type City = "riyadh" | "jeddah" | "dammam" | "ksa";
export type AgeBand = "18-24" | "25-34" | "35-44" | "45+";
export type Interest = "coffee" | "cafes" | "productivity" | "fitness" | "gaming" | "fashion";
export type Platform = "instagram" | "tiktok" | "facebook" | "snapchat" | "x";
export type Bid = "reach" | "engagement";
export type Pacing = "even" | "front" | "back";
export type Headline = "h-origin" | "h-discount" | "h-generic" | "h-morning";
export type Visual = "v-reel" | "v-photo" | "v-logo";
export type Cta = "c-visit" | "c-follow" | "c-buy";

type Option<T extends string> = { id: T; label: string; detail?: string };

export const cities: readonly (Option<City> & { population: number; fit: number })[] = [
  { id: "riyadh", label: "الرياض", detail: "موقع المقهى", population: 7_000_000, fit: 1 },
  { id: "jeddah", label: "جدة", population: 4_600_000, fit: 0.35 },
  { id: "dammam", label: "الدمام", population: 1_500_000, fit: 0.3 },
  { id: "ksa", label: "كل المملكة", population: 33_000_000, fit: 0.4 },
];

export const ageBands: readonly (Option<AgeBand> & { share: number; fit: number })[] = [
  { id: "18-24", label: "18–24", share: 0.17, fit: 0.9 },
  { id: "25-34", label: "25–34", share: 0.22, fit: 1 },
  { id: "35-44", label: "35–44", share: 0.19, fit: 0.7 },
  { id: "45+", label: "45+", share: 0.2, fit: 0.35 },
];

export const interests: readonly (Option<Interest> & { reach: number; fit: number })[] = [
  { id: "coffee", label: "القهوة المختصة", reach: 0.08, fit: 1 },
  { id: "cafes", label: "المقاهي والمطاعم", reach: 0.18, fit: 0.85 },
  { id: "productivity", label: "العمل والإنتاجية", reach: 0.12, fit: 0.6 },
  { id: "fitness", label: "اللياقة", reach: 0.15, fit: 0.4 },
  { id: "gaming", label: "الألعاب", reach: 0.2, fit: 0.25 },
  { id: "fashion", label: "الأزياء الفاخرة", reach: 0.1, fit: 0.3 },
];

export const platforms: readonly (Option<Platform> & { cpm: number; er: number; reach: number })[] = [
  { id: "instagram", label: "إنستغرام", cpm: 1.9, er: 1.1, reach: 0.6 },
  { id: "tiktok", label: "تيك توك", cpm: 1.3, er: 1.25, reach: 0.55 },
  { id: "facebook", label: "فيسبوك", cpm: 1.7, er: 0.8, reach: 0.5 },
  { id: "snapchat", label: "سناب شات", cpm: 1.5, er: 0.85, reach: 0.7 },
  { id: "x", label: "إكس", cpm: 2.1, er: 0.6, reach: 0.4 },
];

export const headlines: readonly (Option<Headline> & { quality: number })[] = [
  { id: "h-origin", label: "«من مزارع جازان إلى فنجانك… تحمّصت اليوم»", quality: 1 },
  { id: "h-morning", label: "«صباحك في الرياض يبدأ من هنا ☕»", quality: 0.9 },
  { id: "h-discount", label: "«خصم 50٪ على كل شيء!!!»", quality: 0.55 },
  { id: "h-generic", label: "«أفضل قهوة في العالم»", quality: 0.45 },
];

export const visuals: readonly (Option<Visual> & { quality: number; video: boolean })[] = [
  { id: "v-reel", label: "فيديو قصير: صبّ القهوة بالحركة البطيئة", quality: 1, video: true },
  { id: "v-photo", label: "صورة احترافية للفنجان والمحمصة", quality: 0.8, video: false },
  { id: "v-logo", label: "الشعار على خلفية سادة", quality: 0.4, video: false },
];

export const ctas: readonly (Option<Cta> & { quality: number })[] = [
  { id: "c-follow", label: "تابعنا وجرّب أول كوب", quality: 1 },
  { id: "c-visit", label: "زورونا اليوم", quality: 0.85 },
  { id: "c-buy", label: "اشترِ الآن", quality: 0.6 },
];

export type Creative = { headline: Headline; visual: Visual; cta: Cta };

export type AdPlan = {
  city: City;
  ages: AgeBand[];
  interests: Interest[];
  platforms: Platform[];
  creative: Creative;
  bid: Bid;
  pacing: Pacing;
  /** Share of each day's budget per platform, summing to 100. */
  split: Partial<Record<Platform, number>>;
};

export type DayDecision = {
  budget: number;
  split: Partial<Record<Platform, number>>;
  creative: Creative;
  /** Launch a fresh variation today: resets fatigue. */
  refresh: boolean;
};

export type DayResult = {
  day: number;
  spend: number;
  impressions: number;
  likes: number;
  clicks: number;
  cpm: number;
  frequency: number;
  competitor: boolean;
  split: Partial<Record<Platform, number>>;
  refreshed: boolean;
};

export type Campaign = {
  plan: AdPlan;
  days: DayResult[];
  /** Impressions since the last creative refresh, for fatigue. */
  freshImpressions: number;
};

// ---------- seeded RNG ----------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- audience & creative ----------

const byId = <T extends { id: string }>(list: readonly T[], id: string) => list.find((item) => item.id === id);

/** People the targeting can reach. */
export function audienceSize(plan: Pick<AdPlan, "city" | "ages" | "interests" | "platforms">): number {
  const city = byId(cities, plan.city);
  if (!city || !plan.ages.length || !plan.platforms.length) return 0;
  const ageShare = plan.ages.reduce((sum, id) => sum + (byId(ageBands, id)?.share ?? 0), 0);
  const interestReach = plan.interests.length
    ? 1 - plan.interests.reduce((product, id) => product * (1 - (byId(interests, id)?.reach ?? 0)), 1)
    : 0.85; // no interest filter: almost everyone
  const platformReach = 1 - plan.platforms.reduce((product, id) => product * (1 - (byId(platforms, id)?.reach ?? 0)), 1);
  return Math.round(city.population * ageShare * interestReach * platformReach);
}

export type SizeVerdict = "narrow" | "good" | "broad";

export function sizeVerdict(size: number): SizeVerdict {
  if (size < 60_000) return "narrow";
  if (size > 1_500_000) return "broad";
  return "good";
}

/** How well the targeting matches the brand's real customers, 0–1. */
export function audienceFit(plan: Pick<AdPlan, "city" | "ages" | "interests" | "platforms">): number {
  const city = byId(cities, plan.city)?.fit ?? 0;
  const ages = plan.ages.length
    ? plan.ages.reduce((sum, id) => sum + (byId(ageBands, id)?.fit ?? 0), 0) / plan.ages.length
    : 0;
  const interest = plan.interests.length
    ? plan.interests.reduce((sum, id) => sum + (byId(interests, id)?.fit ?? 0), 0) / plan.interests.length
    : 0.45;
  const size = audienceSize(plan);
  const verdict = sizeVerdict(size);
  const sizeFactor = verdict === "good" ? 1 : verdict === "broad" ? 0.8 : 0.9;
  return Math.max(0, Math.min(1, city * (0.45 * ages + 0.55 * interest) * sizeFactor));
}

/** Creative quality, 0–1; short video earns a bonus on TikTok/Instagram. */
export function creativeQuality(creative: Creative, platform?: Platform): number {
  const h = byId(headlines, creative.headline)?.quality ?? 0.5;
  const v = byId(visuals, creative.visual);
  const c = byId(ctas, creative.cta)?.quality ?? 0.5;
  let quality = 0.4 * h + 0.4 * (v?.quality ?? 0.5) + 0.2 * c;
  if (platform && v) {
    if ((platform === "tiktok" || platform === "instagram") && v.video) quality *= 1.1;
    if (platform === "tiktok" && !v.video) quality *= 0.8;
    if (platform === "x" && v.video) quality *= 0.95;
  }
  return Math.min(1.1, quality);
}

// ---------- budget pacing ----------

const PACING_WEIGHTS: Record<Pacing, readonly number[]> = {
  even: [1, 1, 1, 1, 1, 1, 1],
  front: [1.5, 1.35, 1.2, 1, 0.8, 0.6, 0.55],
  back: [0.55, 0.6, 0.8, 1, 1.2, 1.35, 1.5],
};

/** Suggested budget for `day` (1-based) given what is left. */
export function suggestedBudget(pacing: Pacing, day: number, remaining: number): number {
  const weights = PACING_WEIGHTS[pacing];
  const rest = weights.slice(day - 1).reduce((sum, w) => sum + w, 0);
  if (rest <= 0) return 0;
  return Math.round(((remaining * weights[day - 1]) / rest) * 100) / 100;
}

export function spentSoFar(campaign: Campaign): number {
  return Math.round(campaign.days.reduce((sum, day) => sum + day.spend, 0) * 100) / 100;
}

export function normaliseSplit(split: Partial<Record<Platform, number>>, allowed: readonly Platform[]): Partial<Record<Platform, number>> {
  const entries = allowed.map((p) => [p, Math.max(0, split[p] ?? 0)] as const);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total <= 0) return Object.fromEntries(allowed.map((p) => [p, 100 / allowed.length]));
  return Object.fromEntries(entries.map(([p, v]) => [p, (v / total) * 100]));
}

// ---------- simulation ----------

export function startCampaign(plan: AdPlan): Campaign {
  return { plan, days: [], freshImpressions: 0 };
}

/** Runs the next day. Spend is clamped so the campaign never exceeds `TOTAL_BUDGET`. */
export function simulateDay(campaign: Campaign, decision: DayDecision, seed: number): Campaign {
  const day = campaign.days.length + 1;
  if (day > CAMPAIGN_DAYS) return campaign;
  const { plan } = campaign;
  const remaining = Math.max(0, TOTAL_BUDGET - spentSoFar(campaign));
  const budget = Math.max(0, Math.min(remaining, Math.round(decision.budget * 100) / 100));
  const rand = mulberry32(seed * 7919 + day * 104_729);
  const size = Math.max(1, audienceSize(plan));
  const fit = audienceFit(plan);
  const competitor = COMPETITOR_DAYS.includes(day);
  const freshBefore = decision.refresh ? 0 : campaign.freshImpressions;
  const frequency = freshBefore / (size * REACHABLE_SHARE);
  const split = normaliseSplit(decision.split, plan.platforms);

  let spend = 0;
  let impressions = 0;
  let likes = 0;
  let clicks = 0;
  for (const platform of plan.platforms) {
    const info = byId(platforms, platform);
    const share = (split[platform] ?? 0) / 100;
    if (!info || share <= 0) continue;
    const dollars = budget * share;
    const narrowPressure = sizeVerdict(size) === "narrow" ? 1.35 : 1;
    const fatigueCpm = 1 + 0.5 * Math.min(3, Math.max(0, frequency - 1.2));
    const competition = competitor && COMPETITOR_PLATFORMS.includes(platform) ? 1.45 : 1;
    const bidCpm = plan.bid === "reach" ? 0.85 : 1.15;
    const noise = 0.94 + rand() * 0.12;
    const cpm = info.cpm * bidCpm * narrowPressure * fatigueCpm * competition * noise;
    const platformImpressions = (dollars / cpm) * 1000;
    const fatigueEr = 1 / (1 + 0.6 * Math.min(3, Math.max(0, frequency - 1.5)));
    const bidEr = plan.bid === "engagement" ? 1.5 : 1;
    const er = 0.024 * fit * creativeQuality(decision.creative, platform) * info.er * bidEr * fatigueEr * (0.95 + rand() * 0.1);
    spend += dollars;
    impressions += platformImpressions;
    likes += platformImpressions * er;
    clicks += platformImpressions * er * 0.35;
  }

  const result: DayResult = {
    day,
    spend: Math.round(spend * 100) / 100,
    impressions: Math.round(impressions),
    likes: Math.round(likes),
    clicks: Math.round(clicks),
    cpm: impressions > 0 ? Math.round((spend / impressions) * 1000 * 100) / 100 : 0,
    frequency: Math.round(frequency * 100) / 100,
    competitor,
    split,
    refreshed: decision.refresh,
  };
  return {
    plan: { ...plan, creative: decision.creative },
    days: [...campaign.days, result],
    freshImpressions: freshBefore + result.impressions,
  };
}

export type CampaignTotals = { spend: number; impressions: number; likes: number; clicks: number; cpm: number; cpe: number };

export function totals(campaign: Campaign): CampaignTotals {
  const spend = spentSoFar(campaign);
  const impressions = campaign.days.reduce((sum, d) => sum + d.impressions, 0);
  const likes = campaign.days.reduce((sum, d) => sum + d.likes, 0);
  const clicks = campaign.days.reduce((sum, d) => sum + d.clicks, 0);
  return {
    spend,
    impressions,
    likes,
    clicks,
    cpm: impressions ? Math.round((spend / impressions) * 1000 * 100) / 100 : 0,
    cpe: likes ? Math.round((spend / likes) * 1000) / 1000 : 0,
  };
}

/** Frequency the next day would start at (for the fatigue warning). */
export function currentFrequency(campaign: Campaign): number {
  return campaign.freshImpressions / Math.max(1, audienceSize(campaign.plan) * REACHABLE_SHARE);
}
