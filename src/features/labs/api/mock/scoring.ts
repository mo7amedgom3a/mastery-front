/**
 * Mock scoring: the server side of a completion. Legacy labs reuse the existing pure scorers;
 * schema labs evaluate their definition's fields/choices against the rubric. The future backend
 * moves this file into the labs module unchanged in spirit.
 */
import type { Campaign } from "../../model/ad-market";
import type { DialogueState } from "../../model/dialogue";
import type { MarketState } from "../../model/market-sim";
import { buildScorecard } from "../../model/scoring";
import type { BadgeSignals, Highlight, QuizResult, Scorecard } from "../../model/types";
import type { CrmEntry } from "../../content/sales";
import { scoreSales } from "../../content/sales";
import type { HrSessions } from "../../content/hr";
import { scoreHr } from "../../content/hr";
import type { SupportRun } from "../../content/support";
import { scoreSupport } from "../../content/support";
import { scoreMarketing } from "../../content/marketing";
import { scoreCeo } from "../../content/ceo";
import type { ObjectionRun } from "../../content/objections/types";
import { objectionScenarios } from "../../content/objections";
import { scoreObjectionTypes, scoreRuler } from "../../content/objections/score";
import type { DealRun } from "../../content/deals/score";
import { scoreDealRecovery } from "../../content/deals/score";
import { dealScenarios } from "../../content/deals";
import type { DealSlug } from "../../model/types";
import { scoreRegistration, type RegistrationRun } from "../../content/registration";
import { scoreGovernance, type GovernanceRun } from "../../content/governance";
import { scoreForecast, type ForecastRun } from "../../content/forecast";
import { scoreClose, type CloseRun } from "../../content/close";
import { scoreCrisis, type CrisisRun } from "../../content/crisis";
import { scoreEscape, type EscapeRun } from "../../content/escape";
import type { SalesFailureRun } from "../../content/sales-failure/types";
import { scoreSalesFailure } from "../../content/sales-failure/score";
import { salesFailureScenario } from "../../content/sales-failure/scenario";
import type {
  LabCompletionRequest,
  LabDefinitionPayload,
  LabField,
  LegacyScorerId,
} from "../contract";
import { evaluateConditions } from "../../model/conditions";

export type ScoredCompletion = { scorecard: Scorecard; signals: BadgeSignals };

export function scoreCompletion(
  definition: LabDefinitionPayload,
  request: LabCompletionRequest,
): ScoredCompletion {
  if (request.engine === "schema" || definition.engine === "schema") {
    return scoreSchemaDefinition(definition, request.answers ?? {});
  }
  const scorer = request.scorer;
  if (!scorer) throw new Error("Legacy completion needs a scorer.");
  return scoreLegacy(scorer, definition.slug, request.run);
}

type MarketingRun = Campaign;
type SalesRun = { call: DialogueState; hypotheses: string[]; crm: CrmEntry; email: string[] };
type HrRun = { sessions: HrSessions; plan: string[] };
type CeoRun = { market: MarketState; causes: string[]; board: DialogueState };
type ObjectionRunInput = { run: ObjectionRun };

function scoreLegacy(scorer: LegacyScorerId, slug: string, raw: unknown): ScoredCompletion {
  switch (scorer) {
    case "marketing": {
      const { scorecard, targetMet } = scoreMarketing(raw as MarketingRun);
      return { scorecard, signals: { marketingTargetMet: targetMet } };
    }
    case "sales": {
      const input = raw as SalesRun;
      const { scorecard, dealClosed } = scoreSales(input);
      return { scorecard, signals: { dealClosed } };
    }
    case "hr": {
      const input = raw as HrRun;
      const { scorecard, peaceMade } = scoreHr(input.sessions, input.plan);
      return { scorecard, signals: { peaceMade } };
    }
    case "support": {
      const { scorecard, coolHead } = scoreSupport(raw as SupportRun);
      return { scorecard, signals: { coolHead } };
    }
    case "ceo": {
      const input = raw as CeoRun;
      const { scorecard, shareDefended } = scoreCeo(input);
      return { scorecard, signals: { shareDefended } };
    }
    case "objections": {
      const scenario = objectionScenarios[slug as keyof typeof objectionScenarios];
      if (!scenario || !("rounds" in scenario)) throw new Error(`No classify scenario for ${slug}`);
      const { run } = raw as ObjectionRunInput;
      const { scorecard, objectionReader } = scoreObjectionTypes(scenario, run);
      return { scorecard, signals: { objectionReader } };
    }
    case "ruler": {
      const scenario = objectionScenarios[slug as keyof typeof objectionScenarios];
      if (!scenario || !("steps" in scenario)) throw new Error(`No ruler scenario for ${slug}`);
      const { run } = raw as ObjectionRunInput;
      const { scorecard, rulerMaster } = scoreRuler(scenario, run);
      return { scorecard, signals: { rulerMaster } };
    }
    case "deals": {
      const scenario = dealScenarios[slug as DealSlug];
      if (!scenario) throw new Error(`No deal scenario for ${slug}`);
      const { scorecard, dealSaved, fairTerms } = scoreDealRecovery(scenario, raw as DealRun);
      return { scorecard, signals: { dealSaved, fairTerms } };
    }
    case "sales-failure": {
      const { scorecard, rejectionProof, funnelMaster } = scoreSalesFailure(salesFailureScenario, raw as SalesFailureRun);
      return { scorecard, signals: { rejectionProof, funnelMaster } };
    }
    case "registration": {
      const { scorecard, founder } = scoreRegistration(raw as RegistrationRun);
      return { scorecard, signals: { founder } };
    }
    case "governance": {
      const { scorecard, governanceGuardian } = scoreGovernance(raw as GovernanceRun);
      return { scorecard, signals: { governanceGuardian } };
    }
    case "forecast": {
      const { scorecard, runwayKeeper } = scoreForecast(raw as ForecastRun);
      return { scorecard, signals: { runwayKeeper } };
    }
    case "close": {
      const { scorecard, cleanClose } = scoreClose(raw as CloseRun);
      return { scorecard, signals: { cleanClose } };
    }
    case "crisis": {
      const { scorecard, crisisCommander } = scoreCrisis(raw as CrisisRun);
      return { scorecard, signals: { crisisCommander } };
    }
    case "escape": {
      const { scorecard, escapeArtist } = scoreEscape(raw as EscapeRun);
      return { scorecard, signals: { escapeArtist } };
    }
  }
}

type SchemaAnswers = {
  fields?: Record<string, unknown>;
  choices?: Record<string, string>;
};

function scoreSchemaDefinition(definition: LabDefinitionPayload, answers: Record<string, unknown>): ScoredCompletion {
  const schema = answers as SchemaAnswers;
  const fieldValues = schema.fields ?? {};
  const choiceValues = schema.choices ?? {};
  const dimensions = definition.scoring.dimensions;
  const highlights: Highlight[] = [];
  const totals = new Map<string, { value: number; weight: number }>();

  const add = (dimension: string, value: number, weight: number) => {
    const current = totals.get(dimension) ?? { value: 0, weight: 0 };
    totals.set(dimension, { value: current.value + value * weight, weight: current.weight + weight });
  };

  for (const field of definition.fields) {
    if (!field.score) continue;
    const value = fieldValues[field.id];
    add(field.score.dimension, scoreField(field, value), field.score.weight ?? 1);
  }

  for (const node of Object.values(definition.pathway?.nodes ?? {})) {
    const chosen = choiceValues[node.id];
    if (!chosen) continue;
    const choice = node.choices?.find((item) => item.id === chosen);
    if (!choice) continue;
    if (choice.note) highlights.push({ at: node.title?.ar ?? node.id, tone: choice.note.tone, text: choice.note.text });
    for (const [dimension, value] of Object.entries(choice.score ?? {})) {
      add(dimension, value, 1);
    }
  }

  const builtDimensions = dimensions.map((dimension) => {
    const total = totals.get(dimension.key);
    const score = total && total.weight ? total.value / total.weight : 60;
    return {
      key: dimension.key,
      label: dimension.label.ar,
      score,
      weight: dimension.weight,
      skill: dimension.skill,
      praise: `أداء جيد في «${dimension.label.ar}».`,
      tip: `راجع «${dimension.label.ar}» وحاول تحسين القرار التالي.`,
    };
  });

  const signalContext = { field: fieldValues, choice: choiceValues, answer: answers };
  const signals: BadgeSignals = {};
  for (const signal of definition.scoring.signals ?? []) {
    if (evaluateConditions(signal.when, signalContext)) {
      (signals as Record<string, boolean>)[signal.key] = true;
    }
  }

  return {
    scorecard: buildScorecard({
      dimensions: builtDimensions,
      highlights,
      verdict: `أكملت «${definition.title}» وحصلت على ${Math.round(
        builtDimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0) /
          (builtDimensions.reduce((sum, dimension) => sum + dimension.weight, 0) || 1),
      )} من 100.`,
    }),
    signals,
  };
}

function scoreField(field: LabField, value: unknown): number {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return 0;
  const rubric = field.score?.rubric;
  if (rubric) {
    if (Array.isArray(value)) {
      const scores = value.map((item) => rubric[String(item)]).filter((item): item is number => typeof item === "number");
      return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 50;
    }
    if (typeof value === "string" && value in rubric) return rubric[value];
  }
  if (field.type === "checkbox") return value ? 100 : 0;
  if (field.type === "number" || field.type === "range") {
    const number = Number(value);
    const min = field.validation?.min ?? 0;
    const max = field.validation?.max ?? 100;
    return Number.isFinite(number) && number >= min && number <= max ? 75 : 40;
  }
  if (field.type === "multiselect") return Array.isArray(value) && value.length > 0 ? 75 : 0;
  if (field.type === "text" || field.type === "textarea") return String(value).trim().length >= 10 ? 80 : 45;
  return 70;
}

export function quizDelta(pre: QuizResult | null, post: QuizResult | null): Highlight | null {
  if (!pre || !post) return null;
  return {
    at: "الاختبار",
    tone: post.percent >= pre.percent ? "good" : "info",
    text: `قبل ${pre.percent}٪ ← بعد ${post.percent}٪.`,
  };
}
