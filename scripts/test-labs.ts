/**
 * Checks the Mastery Labs engines: the ad-market simulator, the dialogue graphs and the scoring.
 * Run with `npm run test:labs`.
 */
import assert from "node:assert/strict";

import { khaledSession, jointSession, saraSession, scoreHr } from "../src/features/labs/content/hr";
import { scoreMarketing } from "../src/features/labs/content/marketing";
import { salesCall, scoreSales } from "../src/features/labs/content/sales";
import {
  CAMPAIGN_DAYS,
  TARGET_IMPRESSIONS,
  TARGET_LIKES,
  TOTAL_BUDGET,
  currentFrequency,
  simulateDay,
  spentSoFar,
  startCampaign,
  suggestedBudget,
  totals,
  type AdPlan,
  type Campaign,
} from "../src/features/labs/model/ad-market";
import { availableChoices, choose, startDialogue, validateGraph, type DialogueGraph, type DialogueState } from "../src/features/labs/model/dialogue";
import { redlinableClauses, redlineTotals } from "../src/features/labs/components/documents/doc-types";
import { buildBoardMeeting, ceoCauses, scoreCeo } from "../src/features/labs/content/ceo";
import { dealScenarios } from "../src/features/labs/content/deals";
import { ACCEPTANCE_TARGET, MARGIN_FLOOR, scoreDealRecovery } from "../src/features/labs/content/deals/score";
import { caseNotes, scoreSupport, supportChat, type CompensationForm } from "../src/features/labs/content/support";
import type { Attempt } from "../src/features/labs/model/progress-store";
import type { Skill } from "../src/features/labs/model/types";
import { buildLabInsights, filterAttemptsByRange } from "../src/features/student-insights/model/lab-insights";
import { pickConsultations, pickExperts } from "../src/features/student-insights/model/growth-mocks";
import {
  RUNWAY_TARGET,
  TARGET_SHARE,
  simulateQuarter,
  startMarket,
  type Allocation,
  type MarketState,
} from "../src/features/labs/model/market-sim";
import { labs } from "../src/features/labs/model/catalog";
import { rankCards } from "../src/features/labs/model/recommendations";
import { clock } from "../src/features/labs/model/scoring";
import { objectionScenarios } from "../src/features/labs/content/objections";
import { scoreObjectionTypes, scoreRuler } from "../src/features/labs/content/objections/score";
import type { ObjectionRun } from "../src/features/labs/content/objections/types";
import { salesFailureScenario } from "../src/features/labs/content/sales-failure/scenario";
import { requiredFunnel, scoreSalesFailure } from "../src/features/labs/content/sales-failure/score";
import type { SalesFailureRun, WeekPlan } from "../src/features/labs/content/sales-failure/types";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}

// ---------- ad market ----------

const goodPlan: AdPlan = {
  city: "riyadh",
  ages: ["18-24", "25-34"],
  interests: ["coffee", "cafes"],
  platforms: ["tiktok", "snapchat"],
  creative: { headline: "h-origin", visual: "v-reel", cta: "c-follow" },
  bid: "engagement",
  pacing: "even",
  split: { tiktok: 60, snapchat: 40 },
};

const poorPlan: AdPlan = {
  city: "ksa",
  ages: ["35-44", "45+"],
  interests: ["gaming", "fashion"],
  platforms: ["x"],
  creative: { headline: "h-generic", visual: "v-logo", cta: "c-buy" },
  bid: "reach",
  pacing: "front",
  split: { x: 100 },
};

function runCampaign(plan: AdPlan, seed: number, overspend = 1): Campaign {
  let campaign = startCampaign(plan);
  for (let day = 1; day <= CAMPAIGN_DAYS; day++) {
    const remaining = TOTAL_BUDGET - spentSoFar(campaign);
    campaign = simulateDay(
      campaign,
      {
        budget: suggestedBudget(plan.pacing, day, remaining) * overspend,
        split: plan.split,
        creative: plan.creative,
        refresh: currentFrequency(campaign) > 1.2,
      },
      seed,
    );
  }
  return campaign;
}

test("ad simulator is deterministic for a seed", () => {
  assert.deepEqual(runCampaign(goodPlan, 7), runCampaign(goodPlan, 7));
  assert.notDeepEqual(runCampaign(goodPlan, 7).days, runCampaign(goodPlan, 8).days);
});

test("a sensible plan hits 50k impressions and 2k likes within $100", () => {
  for (const seed of [1, 2, 3, 42, 99]) {
    const t = totals(runCampaign(goodPlan, seed));
    assert.ok(t.impressions >= TARGET_IMPRESSIONS, `seed ${seed}: ${t.impressions} impressions`);
    assert.ok(t.likes >= TARGET_LIKES, `seed ${seed}: ${t.likes} likes`);
    assert.ok(t.spend <= TOTAL_BUDGET);
  }
});

test("a poor plan misses the target", () => {
  const t = totals(runCampaign(poorPlan, 42));
  assert.ok(t.likes < TARGET_LIKES, `${t.likes} likes`);
});

test("spend never exceeds the budget, even when days ask for more", () => {
  const campaign = runCampaign(goodPlan, 5, 3);
  assert.ok(spentSoFar(campaign) <= TOTAL_BUDGET, `spent ${spentSoFar(campaign)}`);
  assert.equal(campaign.days.length, CAMPAIGN_DAYS);
});

test("marketing scores stay within 0–100 and reward the good plan", () => {
  const good = scoreMarketing(runCampaign(goodPlan, 42));
  const poor = scoreMarketing(runCampaign(poorPlan, 42));
  for (const card of [good.scorecard, poor.scorecard]) {
    assert.ok(card.overall >= 0 && card.overall <= 100);
    for (const d of card.dimensions) assert.ok(d.score >= 0 && d.score <= 100, `${d.key} ${d.score}`);
  }
  assert.ok(good.targetMet);
  assert.ok(!poor.targetMet);
  assert.ok(good.scorecard.overall > poor.scorecard.overall + 20, `${good.scorecard.overall} vs ${poor.scorecard.overall}`);
});

// ---------- dialogue graphs ----------

const graphs: DialogueGraph[] = [salesCall, khaledSession, saraSession, jointSession];

test("dialogue graphs are structurally sound", () => {
  for (const graph of graphs) assert.deepEqual(validateGraph(graph), [], graph.id);
});

/** Every reachable play-through of a graph (depth-first over the engine itself). */
function allEndings(graph: DialogueGraph): DialogueState[] {
  const endings: DialogueState[] = [];
  const walk = (state: DialogueState, depth: number) => {
    assert.ok(depth < 40, `${graph.id}: path too long`);
    if (state.outcome) {
      endings.push(state);
      return;
    }
    const choices = availableChoices(graph, state);
    assert.ok(choices.length > 0, `${graph.id}: stuck at ${state.nodeId}`);
    for (const choice of choices) walk(choose(graph, state, choice.id), depth + 1);
  };
  walk(startDialogue(graph), 0);
  return endings;
}

test("every dialogue path terminates and every outcome is reachable", () => {
  for (const graph of graphs) {
    const endings = allEndings(graph);
    const outcomes = new Set(endings.map((s) => s.outcome));
    assert.ok(outcomes.has("success"), `${graph.id}: no success path`);
    assert.ok(outcomes.has("fail"), `${graph.id}: no fail path`);
  }
});

test("sales: pitching first sounds generic; impatience ends the call", () => {
  const afterPitch = choose(salesCall, startDialogue(salesCall), "pitch-first");
  assert.equal(afterPitch.nodeId, "generic");
  const hangup = allEndings(salesCall).find((s) => s.nodeId === "hangup");
  assert.ok(hangup && hangup.outcome === "fail");
});

test("sales scores stay within 0–100 on every path, and the best path scores high", () => {
  let best = 0;
  for (const call of allEndings(salesCall)) {
    const { scorecard } = scoreSales({
      call,
      hypotheses: ["fuel", "routes", "season"],
      crm: { stage: "discovery", dealValue: 38_000, notes: ["n-fuel", "n-budget", "n-cfo", "n-timeline", "n-vendor"], nextStep: "meeting" },
      email: ["e-thanks", "e-fuel", "e-pilot", "e-budget", "e-meeting"],
    });
    assert.ok(scorecard.overall >= 0 && scorecard.overall <= 100);
    for (const d of scorecard.dimensions) assert.ok(d.score >= 0 && d.score <= 100, `${d.key} ${d.score}`);
    best = Math.max(best, scorecard.overall);
  }
  assert.ok(best >= 85, `best sales path scored ${best}`);
});

test("sales CRM flags a deal value above the budget cap", () => {
  const call = allEndings(salesCall).find((s) => s.outcome === "success" && s.facts.includes("budget"));
  assert.ok(call);
  const { scorecard } = scoreSales({
    call,
    hypotheses: [],
    crm: { stage: "discovery", dealValue: 60_000, notes: [], nextStep: "meeting" },
    email: [],
  });
  assert.ok(scorecard.highlights.some((h) => h.text.includes("سقف الميزانية")));
});

test("hr scores stay within 0–100; a clean mediation earns the peacemaker signal", () => {
  const khaled = allEndings(khaledSession);
  const sara = allEndings(saraSession);
  const joint = allEndings(jointSession);
  let peace = false;
  for (const k of khaled.slice(0, 6)) {
    for (const s of sara.slice(0, 6)) {
      for (const j of joint) {
        const { scorecard, peaceMade } = scoreHr({ khaled: k, sara: s, joint: j }, ["r-rota", "r-credit", "r-private", "r-followup"]);
        assert.ok(scorecard.overall >= 0 && scorecard.overall <= 100);
        for (const d of scorecard.dimensions) assert.ok(d.score >= 0 && d.score <= 100, `${d.key} ${d.score}`);
        peace ||= peaceMade;
      }
    }
  }
  assert.ok(peace, "no path makes peace");
});

// ---------- phase 2: support, deal recovery, CEO ----------

const scorecardInBounds = (card: { overall: number; dimensions: { key: string; score: number }[] }, label: string) => {
  assert.ok(card.overall >= 0 && card.overall <= 100, `${label}: overall ${card.overall}`);
  for (const d of card.dimensions) assert.ok(d.score >= 0 && d.score <= 100, `${label}: ${d.key} ${d.score}`);
};

function runMarket(allocation: Allocation, events: string[], seed = 7): MarketState {
  return events.reduce((state, event) => simulateQuarter(state, allocation, event, seed), startMarket());
}
const balanced: Allocation = { price: 0, marketing: 15, delivery: 35, loyalty: 30, b2b: 10, cost: 10 };
const priceWar: Allocation = { price: 70, marketing: 30, delivery: 0, loyalty: 0, b2b: 0, cost: 0 };
const balancedEvents = ["guarantee", "promote", "targeted", "winback"];
const priceWarEvents = ["match", "counter", "refuse", "hold"];

const newGraphs: DialogueGraph[] = [
  supportChat,
  ...Object.values(dealScenarios).map((s) => s.graph),
  buildBoardMeeting(runMarket(balanced, balancedEvents)),
  buildBoardMeeting(runMarket(priceWar, priceWarEvents)),
];

test("phase-2 dialogue graphs are structurally sound", () => {
  for (const graph of newGraphs) assert.deepEqual(validateGraph(graph), [], graph.id);
});

test("phase-2 dialogue paths terminate; success and failure are reachable", () => {
  for (const graph of newGraphs.slice(0, -1)) {
    const outcomes = new Set(allEndings(graph).map((s) => s.outcome));
    assert.ok(outcomes.has("success"), `${graph.id}: no success path`);
    assert.ok(outcomes.has("fail"), `${graph.id}: no fail path`);
  }
  // A board facing a burnt-out company can still be lost, and never fully won.
  const weak = new Set(allEndings(newGraphs.at(-1)!).map((s) => s.outcome));
  assert.ok(weak.has("fail") && !weak.has("success"), `weak board outcomes: ${[...weak].join(",")}`);
});

test("market sim is deterministic; balanced strategy recovers share with runway", () => {
  assert.deepEqual(runMarket(balanced, balancedEvents), runMarket(balanced, balancedEvents));
  for (const seed of [1, 7, 42]) {
    const s = runMarket(balanced, balancedEvents, seed);
    assert.ok(s.share >= TARGET_SHARE, `seed ${seed}: share ${s.share}`);
    assert.ok(s.runway >= RUNWAY_TARGET, `seed ${seed}: runway ${s.runway}`);
  }
});

test("an all-in price war burns the cash (runway < 6 months)", () => {
  for (const seed of [1, 7, 42]) {
    const s = runMarket(priceWar, priceWarEvents, seed);
    assert.ok(s.runway < 6, `seed ${seed}: runway ${s.runway}`);
  }
});

test("ceo scores stay in bounds; the best play scores high and defends share", () => {
  const good = runMarket(balanced, balancedEvents);
  const bad = runMarket(priceWar, priceWarEvents);
  const correct = ceoCauses.filter((c) => c.correct).map((c) => c.id);
  let best = 0;
  let defended = false;
  for (const board of allEndings(buildBoardMeeting(good))) {
    const { scorecard, shareDefended } = scoreCeo({ market: good, causes: correct, board });
    scorecardInBounds(scorecard, "ceo good");
    best = Math.max(best, scorecard.overall);
    defended ||= shareDefended;
  }
  for (const board of allEndings(buildBoardMeeting(bad))) {
    const { scorecard, shareDefended } = scoreCeo({ market: bad, causes: ["price-only"], board });
    scorecardInBounds(scorecard, "ceo bad");
    assert.ok(!shareDefended);
    assert.ok(scorecard.overall < 60, `price war scored ${scorecard.overall}`);
  }
  assert.ok(best >= 85, `best ceo play scored ${best}`);
  assert.ok(defended);
});

test("support scores stay in bounds; the calm, in-policy resolution scores high", () => {
  const bestForm: CompensationForm = { refundDouble: true, resolution: "replace", priority: true, pickup: true, goodwill: 150, supervisor: false };
  const greedyForm: CompensationForm = { refundDouble: false, resolution: "replace-keep", priority: false, pickup: false, goodwill: 500, supervisor: false };
  let best = 0;
  let cool = false;
  for (const chat of allEndings(supportChat)) {
    const truthful = caseNotes.filter((n) => n.fact && n.fact !== "promise" && chat.facts.includes(n.fact)).map((n) => n.id);
    const run = { triage: { priority: "urgent" as const, tags: ["double-charge", "shipping-damage", "public-risk"] }, triageSeconds: 90, chat };
    const good = scoreSupport({ ...run, form: bestForm, notes: truthful });
    const poor = scoreSupport({ ...run, form: greedyForm, notes: ["n-misuse"] });
    scorecardInBounds(good.scorecard, "support good");
    scorecardInBounds(poor.scorecard, "support poor");
    assert.ok(good.scorecard.overall > poor.scorecard.overall);
    best = Math.max(best, good.scorecard.overall);
    cool ||= good.coolHead;
  }
  assert.ok(best >= 85, `best support path scored ${best}`);
  assert.ok(cool, "no path earns cool-head");
  const publicEnding = allEndings(supportChat).find((s) => s.nodeId === "public");
  assert.ok(publicEnding?.outcome === "fail");
});

test("every redlinable clause keeps a 'keep' first option and offers a balanced one", () => {
  for (const scenario of Object.values(dealScenarios)) {
    const clauses = redlinableClauses(scenario.document);
    assert.ok(clauses.length >= 4, `${scenario.slug}: ${clauses.length} clauses`);
    for (const clause of clauses) {
      assert.equal(clause.options?.[0]?.id, "keep", `${scenario.slug}/${clause.id}`);
      assert.ok(clause.options?.some((o) => o.balanced), `${scenario.slug}/${clause.id}: no balanced option`);
    }
    const allBalanced = Object.fromEntries(clauses.map((c) => [c.id, c.options!.find((o) => o.balanced)!.id]));
    const allGiveaway = Object.fromEntries(clauses.map((c) => [c.id, c.options!.at(-1)!.id]));
    const fair = redlineTotals(scenario.document, allBalanced, scenario.base);
    const soft = redlineTotals(scenario.document, allGiveaway, scenario.base);
    assert.ok(fair.acceptance >= ACCEPTANCE_TARGET && fair.margin >= MARGIN_FLOOR, `${scenario.slug}: balanced ${fair.acceptance}/${fair.margin}`);
    assert.ok(soft.margin < MARGIN_FLOOR, `${scenario.slug}: giveaway keeps margin ${soft.margin}`);
  }
});

test("deal-recovery scores stay in bounds; the best play saves the deal on fair terms", () => {
  for (const scenario of Object.values(dealScenarios)) {
    const clauses = redlinableClauses(scenario.document);
    const redlines = Object.fromEntries(clauses.map((c) => [c.id, c.options!.find((o) => o.balanced)!.id]));
    const causes = scenario.rootCauses.filter((c) => c.correct).map((c) => c.id);
    let best = 0;
    let saved = false;
    for (const call of allEndings(scenario.graph)) {
      const nextStep = scenario.nextSteps.find((s) => call.outcome && s.validFor.includes(call.outcome))?.id ?? null;
      const stage = call.outcome === "success" ? "negotiation" : call.outcome === "fail" ? "lost" : "stalled";
      const probability = call.outcome === "success" ? 70 : call.outcome === "fail" ? 10 : 30;
      const { scorecard, dealSaved, fairTerms } = scoreDealRecovery(scenario, {
        causes,
        call,
        redlines,
        crm: { stage, value: scenario.base.value, probability, nextStep },
      });
      scorecardInBounds(scorecard, scenario.slug);
      assert.ok(fairTerms, `${scenario.slug}: balanced redlines are not fair terms`);
      best = Math.max(best, scorecard.overall);
      saved ||= dealSaved;
    }
    assert.ok(best >= 85, `${scenario.slug}: best play scored ${best}`);
    assert.ok(saved, `${scenario.slug}: no path saves the deal`);
    const lazy = scoreDealRecovery(scenario, {
      causes: scenario.rootCauses.filter((c) => !c.correct).map((c) => c.id).slice(0, 3),
      call: allEndings(scenario.graph).find((s) => s.outcome === "fail")!,
      redlines: {},
      crm: { stage: "awaiting-signature", value: scenario.base.value * 2, probability: 90, nextStep: null },
    });
    scorecardInBounds(lazy.scorecard, `${scenario.slug} lazy`);
    assert.ok(lazy.scorecard.overall < 40, `${scenario.slug}: lazy play scored ${lazy.scorecard.overall}`);
  }
});


// ---------- lab behaviour insights ----------

function dim(skill: Skill, score: number) {
  return { key: `${skill}-dim`, label: skill, skill, score, tip: `طوّر ${skill}` };
}

function attempt(overrides: Partial<Attempt> & Pick<Attempt, "id" | "slug" | "at" | "overall" | "dimensions">): Attempt {
  return {
    readiness: overrides.overall >= 80 ? "متميّز" : overrides.overall >= 60 ? "جاهز" : "مبتدئ",
    xp: 100,
    badges: [],
    categoryLegacyId: 0,
    categoryName: "التسويق المتكامل",
    minutes: 10,
    highlights: [],
    pre: null,
    post: null,
    signals: {},
    attemptNo: 1,
    ...overrides,
  };
}

const attempts: Attempt[] = [
  attempt({
    id: "a1",
    slug: "marketing-ads",
    at: "2026-10-01T10:00:00.000Z",
    overall: 60,
    dimensions: [dim("analysis", 50), dim("decision", 60), dim("execution", 40)],
    highlights: [{ at: "اليوم 2", tone: "bad", text: "حرقت نصف الميزانية قبل اختبار الإعلان." }],
  }),
  attempt({
    id: "a2",
    slug: "marketing-ads",
    at: "2026-10-10T10:00:00.000Z",
    overall: 80,
    attemptNo: 2,
    dimensions: [dim("analysis", 85), dim("decision", 80), dim("execution", 70)],
    highlights: [{ at: "اليوم 4", tone: "good", text: "أوقفت الجمهور الخاسر في اليوم الثالث." }],
  }),
  attempt({
    id: "a3",
    slug: "sales-discovery-call",
    at: "2026-10-20T10:00:00.000Z",
    overall: 70,
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    dimensions: [dim("communication", 90), dim("empathy", 50), dim("persuasion", 70), dim("execution", 60)],
    highlights: [{ at: "03:10", tone: "bad", text: "قاطعت العميل أثناء شرح مشكلة التسليم." }],
  }),
];

test("lab insights: summary, best lab and averages", () => {
  const insight = buildLabInsights(attempts);
  assert.equal(insight.summary.attempts, 3);
  assert.equal(insight.summary.labs, 2);
  assert.equal(insight.summary.average, 70);
  assert.equal(insight.summary.bestLab?.slug, "marketing-ads");
  assert.equal(insight.summary.bestLab?.score, 80);
  assert.equal(insight.summary.consistency, 84);
  assert.equal(insight.summary.minutes, 30);
});

test("lab insights: weakest skill and gap ranking", () => {
  const insight = buildLabInsights(attempts);
  assert.equal(insight.summary.weakest?.skill, "empathy");
  assert.equal(insight.summary.strongest?.skill, "communication");
  assert.deepEqual(
    insight.gaps.map((gap) => gap.skill),
    ["empathy", "execution", "persuasion"],
  );
  assert.ok(insight.gaps.every((gap) => (gap.level ?? 0) < 75));
});

test("lab insights: observations carry the weakest axis advice", () => {
  const insight = buildLabInsights(attempts);
  assert.equal(insight.observations.length, 3);
  const bad = insight.observations.find((ob) => ob.text.includes("قاطعت العميل"));
  assert.ok(bad, "missing sales observation");
  assert.ok(bad!.advice.length > 0, "bad observation has no advice");
  assert.equal(insight.observations[0].id, "a3-0");
});

test("lab insights: range filter and timeline order", () => {
  const range = filterAttemptsByRange(attempts, "30d", new Date("2026-11-12T00:00:00.000Z"));
  assert.equal(range.length, 1);
  assert.equal(range[0].id, "a3");
  const insight = buildLabInsights(attempts);
  assert.deepEqual(
    insight.timeline.map((point) => point.id),
    ["a1", "a2", "a3"],
  );
  assert.equal(insight.timeline[2].weakestLabel, "empathy");
});

test("lab insights: single attempt has no consistency or trend", () => {
  const insight = buildLabInsights([attempts[0]]);
  assert.equal(insight.summary.consistency, null);
  assert.equal(insight.summary.average, 60);
  assert.equal(insight.styles.pre, null);
});

test("growth mocks: match the weakest skills deterministically", () => {
  const insight = buildLabInsights(attempts);
  const consultations = pickConsultations(insight.gaps, 2);
  assert.equal(consultations.length, 2);
  assert.ok(consultations.every((item) => item.skills.includes("empathy")));
  const expertsA = pickExperts(insight.gaps, 2).map((item) => item.key);
  const expertsB = pickExperts(insight.gaps, 2).map((item) => item.key);
  assert.deepEqual(expertsA, expertsB);
  assert.equal(expertsA.length, 2);
});

// ---------- objection labs (129) ----------

const six = objectionScenarios["objections-six-types"];
const ruler = objectionScenarios["objections-competitor-ruler"];

test("objection labs: both mechanics are registered", () => {
  assert.equal(six.mechanic, "classify");
  assert.equal(ruler.mechanic, "ruler");
});

test("six-types: the best play reads every objection; the worst play is penalised", () => {
  assert.equal(six.mechanic, "classify");
  if (six.mechanic !== "classify") return;
  const best: ObjectionRun = {
    rounds: six.rounds.map((round) => {
      const reply = round.replies.find((option) => option.quality === 2)!;
      return {
        roundId: round.id,
        kind: round.kind,
        bridgeId: round.bridges.find((option) => option.correct)!.id,
        replyId: reply.id,
        trust: 90,
        tension: 20,
        tags: reply.tags,
      };
    }),
    rulerSteps: {},
    benefits: [],
    commitment: "pilot",
    crm: { stage: "pilot", nextStep: "partner-meeting", notes: ["n-price", "n-partner", "n-pilot", "n-metrics"] },
    trust: 90,
    tension: 20,
  };
  const worst: ObjectionRun = {
    rounds: six.rounds.map((round) => ({
      roundId: round.id,
      kind: "competitor",
      bridgeId: round.bridges.find((option) => !option.correct)!.id,
      replyId: round.replies.find((option) => option.quality === 0)!.id,
      trust: 10,
      tension: 90,
      tags: [],
    })),
    rulerSteps: {},
    benefits: [],
    commitment: "discount",
    crm: { stage: "lost", nextStep: "none", notes: ["n-open-budget", "n-old-better"] },
    trust: 10,
    tension: 90,
  };
  const good = scoreObjectionTypes(six, best);
  const bad = scoreObjectionTypes(six, worst);
  scorecardInBounds(good.scorecard, "six-types good");
  scorecardInBounds(bad.scorecard, "six-types bad");
  assert.ok(good.objectionReader);
  assert.ok(good.scorecard.overall >= 85, `six-types best scored ${good.scorecard.overall}`);
  assert.ok(bad.scorecard.overall < 40, `six-types worst scored ${bad.scorecard.overall}`);
  assert.ok(
    good.scorecard.highlights.every((highlight) => !["misunderstanding", "doubt", "price", "false"].includes(highlight.at)),
    "objection highlights should use Arabic round labels",
  );
});

test("ruler: the five steps and the benefit barrier produce a fair pilot", () => {
  assert.equal(ruler.mechanic, "ruler");
  if (ruler.mechanic !== "ruler") return;
  const best: ObjectionRun = {
    rounds: [],
    rulerSteps: Object.fromEntries(ruler.steps.map((step) => [step.id, step.options.find((option) => option.correct)!.id])),
    benefits: ruler.benefits.filter((benefit) => benefit.correct).map((benefit) => benefit.id),
    commitment: "pilot",
    crm: { stage: "pilot", nextStep: "pilot", notes: ["n-vendor", "n-gap", "n-companies", "n-pilot"] },
    trust: 90,
    tension: 20,
  };
  const worst: ObjectionRun = {
    rounds: [],
    rulerSteps: Object.fromEntries(ruler.steps.map((step) => [step.id, step.options.find((option) => !option.correct)!.id])),
    benefits: ruler.benefits.filter((benefit) => !benefit.correct).map((benefit) => benefit.id),
    commitment: "discount",
    crm: { stage: "lost", nextStep: "none", notes: ["n-unhappy", "n-price"] },
    trust: 10,
    tension: 90,
  };
  const good = scoreRuler(ruler, best);
  const bad = scoreRuler(ruler, worst);
  scorecardInBounds(good.scorecard, "ruler good");
  scorecardInBounds(bad.scorecard, "ruler bad");
  assert.ok(good.rulerMaster);
  assert.ok(good.scorecard.overall >= 85, `ruler best scored ${good.scorecard.overall}`);
  assert.ok(bad.scorecard.overall < 40, `ruler worst scored ${bad.scorecard.overall}`);
});

// ---------- sales-failure lab (258) ----------

const tagsOf = (state: DialogueState) =>
  Object.entries(state.tags).flatMap(([tag, count]) => Array.from({ length: count }, () => tag));
const notesOf = (state: DialogueState) =>
  state.transcript.filter((entry) => entry.note).map((entry) => ({ at: clock(entry.at), tone: entry.note!.tone, text: entry.note!.text }));

test("sales-failure: the cold-call graph is sound and reaches success and failure", () => {
  assert.deepEqual(validateGraph(salesFailureScenario.graph), []);
  const outcomes = new Set(allEndings(salesFailureScenario.graph).map((state) => state.outcome));
  assert.ok(outcomes.has("success"), "no success path");
  assert.ok(outcomes.has("fail"), "no fail path");
});

test("sales-failure: the funnel maths is 6 deals → 20 proposals → 40 meetings → 200 calls → 400 prospects", () => {
  assert.deepEqual(requiredFunnel(salesFailureScenario.funnel), { prospects: 400, calls: 200, meetings: 40, proposals: 20 });
});

test("sales-failure: the best week avoids most of the ten causes; the lazy week misses them", () => {
  const success = allEndings(salesFailureScenario.graph).find((state) => state.outcome === "success")!;
  const failure =
    allEndings(salesFailureScenario.graph).find((state) => state.outcome === "fail" && Boolean(state.tags.giveup)) ??
    allEndings(salesFailureScenario.graph).find((state) => state.outcome === "fail")!;
  const bestWeek: WeekPlan = {
    sun: ["prospecting", "calls"],
    mon: ["calls", "visits"],
    tue: ["visits", "followup"],
    wed: ["followup", "proposals"],
    thu: ["proposals", "learning"],
  };
  const bestRun: SalesFailureRun = {
    plan: bestWeek,
    funnel: requiredFunnel(salesFailureScenario.funnel),
    questions: salesFailureScenario.questionBank.filter((question) => question.correct).map((question) => question.id),
    call: { outcome: success.outcome, tags: tagsOf(success), notes: notesOf(success) },
    followUp: { 1: "s1-now", 2: "s2-case", 3: "s3-review" },
    postPercent: 100,
  };
  const worstRun: SalesFailureRun = {
    plan: { sun: [], mon: [], tue: [], wed: [], thu: [] },
    funnel: { prospects: 0, calls: 0, meetings: 0, proposals: 0 },
    questions: salesFailureScenario.questionBank.filter((question) => !question.correct).map((question) => question.id),
    call: { outcome: failure.outcome, tags: tagsOf(failure), notes: notesOf(failure) },
    followUp: { 1: "s1-none", 2: "s2-discount", 3: "s3-none" },
    postPercent: 0,
  };
  const good = scoreSalesFailure(salesFailureScenario, bestRun);
  const bad = scoreSalesFailure(salesFailureScenario, worstRun);
  scorecardInBounds(good.scorecard, "sales-failure good");
  scorecardInBounds(bad.scorecard, "sales-failure bad");
  assert.ok(good.rejectionProof);
  assert.ok(good.funnelMaster);
  assert.ok(good.scorecard.overall >= 85, `sales-failure best scored ${good.scorecard.overall}`);
  assert.ok(bad.scorecard.overall < 40, `sales-failure worst scored ${bad.scorecard.overall}`);
  const goodAvoided = Object.values(good.causes).filter((status) => status === "avoided").length;
  const badAvoided = Object.values(bad.causes).filter((status) => status === "avoided").length;
  assert.ok(goodAvoided >= 7, `best week avoided ${goodAvoided}/10`);
  assert.ok(badAvoided <= 1, `lazy week avoided ${badAvoided}/10`);
});

// ---------- recommendations and catalog ----------

test("recommendations pin the two source courses first, then the best other course", () => {
  const cards = [
    { slug: "course-100", title: "مهارات البيع والتسويق العقاري" },
    { slug: "course-129", title: "التعامل مع اعتراضات العملاء" },
    { slug: "course-258", title: "فشل المبيعات" },
    { slug: "course-96", title: "أساسيات التفاوض" },
    { slug: "course-999", title: "دورة قديمة — انتهى التسجيل" },
  ];
  const ranked = rankCards(cards, ["فشل المبيعات", "اعتراضات", "التفاوض"], 3, ["course-129", "course-258"]);
  assert.deepEqual(ranked.map((card) => card.slug), ["course-129", "course-258", "course-96"]);
  const missing = rankCards(cards, ["فشل المبيعات", "اعتراضات"], 2, ["course-404"]);
  assert.deepEqual(missing.map((card) => card.slug), ["course-258", "course-129"]);
  const closed = rankCards(cards, [], 5, ["course-999"]);
  assert.notEqual(closed[0]?.slug, "course-999", "a closed cohort was pinned first");
  assert.equal(closed.at(-1)?.slug, "course-999", "a closed cohort should rank last");
});

test("catalog: the three new labs are registered with their source courses", () => {
  const slugs = labs.map((lab) => lab.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate lab slug");
  assert.ok(labs.length >= 12, `${labs.length} labs`);
  for (const slug of ["objections-six-types", "objections-competitor-ruler", "sales-failure-week"] as const) {
    const lab = labs.find((entry) => entry.slug === slug);
    assert.ok(lab, `${slug} missing`);
    assert.equal(lab.categoryLegacyId, 3);
    assert.deepEqual(lab.featuredCourseSlugs, ["course-129", "course-258"]);
    assert.ok(lab.phases.length >= 3);
    assert.ok(lab.tagline.length > 0);
  }
});

console.log(`\n${passed} labs checks passed`);
