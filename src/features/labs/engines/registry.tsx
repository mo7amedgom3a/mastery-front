"use client";

/**
 * Engine registry for the live API: `engine_key` → the storefront runner.
 *
 * Engines are code (here and in `newwebsitebackend/app/modules/labs/domain/engines`); scenarios
 * are data served by the API.
 * - `schema` renders the admin-authored pathway with the generic SchemaLab.
 * - `dialogue` runs admin engines (sales, HR, support…) with the generic DialogueLab; the scenario
 *   carries its resolved engine (meters, personas, constraints) and the server scores the run.
 * - Bespoke engines still read their content from `content/*` by `bundled_slug` until each
 *   engine is ported (its scenario document then carries the content and the runner takes it as
 *   a prop). A scenario without `bundled_slug` for an unported engine cannot run yet.
 */
import type { ReactNode } from "react";

import type { LabRuntime, LiveLabRuntime } from "../api/contract";
import { LabRunProvider } from "../api/hooks/lab-run-context";
import { LabPage } from "../components/lab-page";
import { SchemaLab } from "../components/schema/schema-lab";
import { BlocksLab } from "../components/blocks/blocks-lab";
import { DialogueLab } from "../components/dialogue/dialogue-lab";
import { findLab } from "../model/catalog";
import type { LabSlug } from "../model/types";

export const BESPOKE_ENGINES = [
  "dialogue-call",
  "hr-mediation",
  "support-ticket",
  "deal-recovery",
  "objections",
  "sales-failure-week",
  "ad-market",
  "market-ceo",
  "portal-registration",
  "governance-board",
  "forecast-runway",
  "quarter-close",
  "crisis-room",
  "escape-room",
] as const;

type SchemaContent = {
  personas?: LabRuntime["personas"];
  fields?: LabRuntime["fields"];
  pathway?: LabRuntime["pathway"];
};

/** Live runtime (lab definition + one scenario document) → the shape SchemaLab renders. */
export function toSchemaRuntime(runtime: LiveLabRuntime): LabRuntime {
  const content = (runtime.scenario?.content ?? {}) as SchemaContent;
  const { card, definition } = runtime;
  return {
    lab_id: runtime.lab_id,
    slug: card.slug,
    version: runtime.version,
    engine: "schema",
    title: card.title,
    tagline: card.tagline,
    role: definition.role,
    scenario: definition.scenario,
    targets: definition.targets,
    constraints: definition.constraints,
    field_category_id: card.field_category_id ?? 0,
    category_name: card.category_name ?? "",
    skills: card.skills,
    difficulty: card.difficulty,
    minutes: card.minutes,
    color: card.color,
    phases: definition.phases,
    personas: content.personas ?? [],
    fields: content.fields ?? [],
    pathway: content.pathway ?? null,
    requirements: definition.requirements,
    scoring: definition.scoring,
    recommendations: definition.recommendations,
    locale: definition.locale,
  };
}

export type LiveRunnerProps = { runtime: LiveLabRuntime; previewToken?: string | null };

/** The runner for a live lab + scenario, or `null` when this storefront cannot run it. */
export function renderLiveRunner({ runtime, previewToken }: LiveRunnerProps): ReactNode {
  const scenario = runtime.scenario;
  if (!scenario) return null;
  const target = {
    apiSlug: runtime.card.slug,
    scenarioKey: scenario.key,
    previewToken: previewToken ?? undefined,
    scorer: runtime.scorer,
  };
  if (runtime.engine === "blocks") {
    return (
      <LabRunProvider target={target}>
        <BlocksLab key={`${runtime.card.slug}:${scenario.key}`} runtime={runtime} preview={Boolean(previewToken)} />
      </LabRunProvider>
    );
  }
  if (runtime.engine === "dialogue") {
    return (
      <LabRunProvider target={target}>
        <DialogueLab key={`${runtime.card.slug}:${scenario.key}`} runtime={runtime} preview={Boolean(previewToken)} />
      </LabRunProvider>
    );
  }
  if (runtime.engine === "schema") {
    return (
      <LabRunProvider target={target}>
        <SchemaLab key={`${runtime.card.slug}:${scenario.key}`} runtime={toSchemaRuntime(runtime)} preview={Boolean(previewToken)} />
      </LabRunProvider>
    );
  }
  const bundled = typeof scenario.content.bundled_slug === "string" ? scenario.content.bundled_slug : null;
  if (!bundled || !findLab(bundled)) return null;
  return (
    <LabRunProvider target={target}>
      <LabPage key={bundled} slug={bundled as LabSlug} />
    </LabRunProvider>
  );
}
