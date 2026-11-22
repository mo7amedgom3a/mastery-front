/**
 * Export the storefront labs to the backend labs module.
 *
 *   npx tsx scripts/labs-export.ts [--out ../newwebsitebackend]
 *
 * 1. Seed bundles (`app/modules/labs/seed/*.json`): one portable bundle per lab, in the format of
 *    `POST /api/v1/admin/labs/import`. The 18 bespoke labs keep their content in this repo until
 *    their engine is ported; their scenario documents reference it by `bundled_slug`. The four
 *    deal-recovery labs become one `deal-recovery` lab with four sector scenarios. The admin-style
 *    schema fixtures are exported as fully data-driven `schema` labs.
 * 2. Golden runs (`tests/fixtures/labs/schema/*.json`): answers → scorecard computed by the
 *    storefront scorer, which the Python `schema` engine must reproduce exactly.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { labs } from "../src/features/labs/model/catalog";
import type { LabDefinition } from "../src/features/labs/model/types";
import type { LabDefinitionPayload } from "../src/features/labs/api/contract";
import { schemaFixtures } from "../src/features/labs/api/mock/seed";
import { scoreCompletion } from "../src/features/labs/api/mock/scoring";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const backend = resolve(outIndex >= 0 ? args[outIndex + 1] : "../newwebsitebackend");
const seedDir = join(backend, "app/modules/labs/seed");
const goldenDir = join(backend, "tests/fixtures/labs/schema");

/** Storefront runner → backend engine key. */
const ENGINE_BY_SLUG: Record<string, string> = {
  "marketing-ads": "ad-market",
  "objections-six-types": "objections",
  "objections-competitor-ruler": "objections",
  "sales-failure-week": "sales-failure-week",
  "sales-discovery-call": "dialogue-call",
  "hr-conflict-mediation": "hr-mediation",
  "support-angry-customer": "support-ticket",
  "deal-recovery-real-estate": "deal-recovery",
  "deal-recovery-medical": "deal-recovery",
  "deal-recovery-food": "deal-recovery",
  "deal-recovery-restaurants": "deal-recovery",
  "ceo-competitor-response": "market-ceo",
  "startup-company-registration": "portal-registration",
  "governance-first-board": "governance-board",
  "cfo-forecast-runway": "forecast-runway",
  "finance-quarter-close": "quarter-close",
  "crisis-data-leak": "crisis-room",
  "audit-escape-room": "escape-room",
};

/** Stage ids emitted by each bespoke runner (kept in sync with `api/mock/seed.ts`). */
const STAGES: Record<string, readonly string[]> = {
  "marketing-ads": ["brief", "pre", "audience", "creative", "budget", "run", "post", "debrief"],
  "sales-discovery-call": ["brief", "pre", "prep", "call", "crm", "email", "post", "debrief"],
  "hr-conflict-mediation": ["brief", "pre", "khaled", "sara", "joint", "plan", "post", "debrief"],
  "support-angry-customer": ["brief", "pre", "console", "chat", "resolve", "post", "debrief"],
  "objections-six-types": ["brief", "pre", "dossier", "mechanic", "commit", "crm", "post", "debrief"],
  "objections-competitor-ruler": ["brief", "pre", "dossier", "mechanic", "commit", "crm", "post", "debrief"],
  "deal-recovery-real-estate": ["brief", "pre", "diagnose", "call", "redline", "crm", "post", "debrief"],
  "ceo-competitor-response": ["brief", "pre", "diagnose", "quarters", "board", "post", "debrief"],
  "sales-failure-week": ["brief", "pre", "plan", "funnel", "questions", "call", "followup", "post", "debrief"],
  "startup-company-registration": ["brief", "pre", "form", "articles", "portal", "officer", "post", "debrief"],
  "governance-first-board": ["brief", "pre", "board", "doa", "coi", "meeting", "minutes", "post", "debrief"],
  "cfo-forecast-runway": ["brief", "pre", "diagnose", "model", "funding", "qa", "post", "debrief"],
  "finance-quarter-close": ["brief", "pre", "calendar", "rec", "entries", "vat", "variance", "review", "post", "debrief"],
  "crisis-data-leak": ["brief", "pre", "room", "statement", "post", "debrief"],
  "audit-escape-room": ["brief", "pre", "room", "memo", "post", "debrief"],
};
const FIXED_LABELS: Record<string, string> = { brief: "الإحاطة", pre: "اختبار قبلي", post: "اختبار بعدي", debrief: "التقييم" };

const DEAL_SECTORS: Record<string, string> = {
  "deal-recovery-real-estate": "real-estate",
  "deal-recovery-medical": "medical",
  "deal-recovery-food": "food",
  "deal-recovery-restaurants": "restaurants",
};

type Bundle = {
  format: "mastery-lab-bundle";
  format_version: 1;
  card: Record<string, unknown>;
  definition: Record<string, unknown>;
  release: Record<string, unknown>;
  scenarios: { key: string; title: string; status: "active"; sort_order: number; weight: number; schema_version: number; content: unknown }[];
};

function phasesFor(lab: LabDefinition): { id: string; label: string; type: string }[] {
  const stages = STAGES[lab.slug] ?? STAGES["deal-recovery-real-estate"];
  const middle = stages.filter((id) => !(id in FIXED_LABELS));
  return stages.map((id) => {
    const index = middle.indexOf(id);
    const label = FIXED_LABELS[id] ?? (index >= 0 && middle.length === lab.phases.length ? lab.phases[index] : id);
    return { id, label, type: id in FIXED_LABELS ? id : "custom" };
  });
}

function card(lab: LabDefinition, sort: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: lab.slug,
    engine_key: ENGINE_BY_SLUG[lab.slug],
    title: lab.title,
    tagline: lab.tagline,
    field_category_id: lab.categoryLegacyId,
    category_name: lab.categoryName,
    difficulty: lab.difficulty,
    minutes: lab.minutes,
    color: lab.color,
    skills: [...lab.skills],
    sort_order: sort,
    ...overrides,
  };
}

function definition(lab: LabDefinition): Record<string, unknown> {
  return {
    schema_version: 1,
    role: lab.role,
    scenario: lab.scenario,
    targets: [...lab.targets],
    constraints: [...lab.constraints],
    phases: phasesFor(lab),
    requirements: [],
    scoring: { dimensions: [], signals: [], readiness: { ready: 60, excellent: 80 }, xp: { base: 50, per_point: 2, per_badge: 50 } },
    pre_quiz: [],
    post_quiz: [],
    recommendations: {
      course_slugs: [...(lab.featuredCourseSlugs ?? [])],
      diploma_slugs: [],
      keywords: [...lab.courseKeywords],
      product_types: ["course", "diploma"],
    },
    scenario_selection: "first",
    locale: "ar",
  };
}

const RELEASE = { locales: ["ar"], starts_at: null, ends_at: null, rollout_pct: 100, kill_switch: false };

function bespokeBundles(): Bundle[] {
  const bundles: Bundle[] = [];
  const deals = labs.filter((lab) => lab.slug in DEAL_SECTORS);
  labs.forEach((lab, index) => {
    if (lab.slug in DEAL_SECTORS) return;
    bundles.push({
      format: "mastery-lab-bundle",
      format_version: 1,
      card: card(lab, index),
      definition: definition(lab),
      release: RELEASE,
      scenarios: [
        { key: "main", title: lab.title, status: "active", sort_order: 0, weight: 1, schema_version: 1, content: { bundled_slug: lab.slug } },
      ],
    });
  });
  const first = deals[0];
  if (first) {
    bundles.push({
      format: "mastery-lab-bundle",
      format_version: 1,
      card: card(first, labs.indexOf(first), {
        slug: "deal-recovery",
        title: "استعادة صفقة متعثرة",
        tagline: "صفقة توقفت قبل التوقيع: شخّص السبب، أعد العميل للطاولة، عدّل العقد وحدّث الـCRM.",
      }),
      definition: { ...definition(first), scenario_selection: "choose" },
      release: RELEASE,
      scenarios: deals.map((lab, order) => ({
        key: DEAL_SECTORS[lab.slug],
        title: lab.title,
        status: "active" as const,
        sort_order: order,
        weight: 1,
        schema_version: 1,
        content: { bundled_slug: lab.slug, sector: DEAL_SECTORS[lab.slug], tagline: lab.tagline, role: lab.role, scenario: lab.scenario },
      })),
    });
  }
  return bundles;
}

function schemaBundle(fixture: LabDefinitionPayload, sort: number): Bundle {
  return {
    format: "mastery-lab-bundle",
    format_version: 1,
    card: {
      slug: fixture.slug,
      engine_key: "schema",
      title: fixture.title,
      tagline: fixture.tagline,
      field_category_id: fixture.field_category_id,
      category_name: fixture.category_name,
      difficulty: fixture.difficulty,
      minutes: fixture.minutes,
      color: fixture.color,
      skills: [...fixture.skills],
      sort_order: sort,
    },
    definition: {
      schema_version: 1,
      role: fixture.role,
      scenario: fixture.scenario,
      targets: fixture.targets,
      constraints: fixture.constraints,
      phases: fixture.phases,
      requirements: fixture.requirements.map((r) => ({ ...r, values: r.values ?? [] })),
      scoring: {
        dimensions: fixture.scoring.dimensions,
        signals: fixture.scoring.signals ?? [],
        readiness: fixture.scoring.readiness ?? { ready: 60, excellent: 80 },
        xp: fixture.scoring.xp ?? { base: 50, per_point: 2, per_badge: 50 },
      },
      pre_quiz: [],
      post_quiz: [],
      recommendations: {
        course_slugs: fixture.recommendations.course_slugs ?? [],
        diploma_slugs: fixture.recommendations.diploma_slugs ?? [],
        keywords: fixture.recommendations.keywords ?? [],
        product_types: fixture.recommendations.product_types ?? [],
      },
      scenario_selection: "first",
      locale: "ar",
    },
    release: RELEASE,
    scenarios: [
      {
        key: "main",
        title: fixture.title,
        status: "active",
        sort_order: 0,
        weight: 1,
        schema_version: 1,
        content: { personas: fixture.personas, fields: fixture.fields, pathway: fixture.pathway },
      },
    ],
  };
}

/** Answer sets per fixture: best, worst, mixed, empty and junk (unknown ids are ignored). */
function cases(fixture: LabDefinitionPayload): { name: string; answers: Record<string, unknown> }[] {
  const fields = fixture.fields;
  const nodes = Object.values(fixture.pathway?.nodes ?? {});
  const best: Record<string, unknown> = {};
  const worst: Record<string, unknown> = {};
  for (const field of fields) {
    const options = field.validation?.options ?? [];
    switch (field.type) {
      case "textarea":
      case "text":
        best[field.id] = "شرح مفصل للفرق والسبب والإجراء المقترح.";
        worst[field.id] = "قصير";
        break;
      case "number":
      case "range":
        best[field.id] = field.validation?.max ?? 50;
        worst[field.id] = (field.validation?.max ?? 100) + 1000;
        break;
      case "select":
      case "radio":
        best[field.id] = options[0]?.value;
        worst[field.id] = options[options.length - 1]?.value;
        break;
      case "multiselect":
        best[field.id] = options.slice(0, 2).map((o) => o.value);
        worst[field.id] = [];
        break;
      case "checkbox":
        best[field.id] = true;
        worst[field.id] = false;
        break;
    }
  }
  const bestChoices: Record<string, string> = {};
  const worstChoices: Record<string, string> = {};
  const midChoices: Record<string, string> = {};
  for (const node of nodes) {
    const choices = node.choices ?? [];
    if (!choices.length) continue;
    bestChoices[node.id] = choices[0].id;
    worstChoices[node.id] = choices[choices.length - 1].id;
    midChoices[node.id] = choices[Math.floor(choices.length / 2)].id;
  }
  return [
    { name: "best", answers: { fields: best, choices: bestChoices } },
    { name: "worst", answers: { fields: worst, choices: worstChoices } },
    { name: "mixed", answers: { fields: { ...worst, ...Object.fromEntries(Object.entries(best).slice(0, 2)) }, choices: midChoices } },
    { name: "empty", answers: { fields: {}, choices: {} } },
    { name: "junk", answers: { fields: { ...best, unknown_field: "x" }, choices: { ...bestChoices, nowhere: "x" } } },
  ];
}

mkdirSync(seedDir, { recursive: true });
mkdirSync(goldenDir, { recursive: true });

const bundles = [...bespokeBundles(), ...schemaFixtures.map((fixture, index) => schemaBundle(fixture, 100 + index))];
for (const bundle of bundles) {
  writeFileSync(join(seedDir, `${bundle.card.slug}.json`), `${JSON.stringify(bundle, null, 2)}\n`);
}

for (const fixture of schemaFixtures) {
  const runs = cases(fixture).map(({ name, answers }) => {
    const { scorecard, signals } = scoreCompletion(fixture, {
      engine: "schema",
      answers,
      pre: null,
      post: null,
      elapsed_seconds: 0,
    });
    return { name, answers, expected: { scorecard, signals } };
  });
  writeFileSync(
    join(goldenDir, `${fixture.slug}.json`),
    `${JSON.stringify({ bundle: schemaBundle(fixture, 0), runs }, null, 2)}\n`,
  );
}

console.log(`labs-export: ${bundles.length} bundles → ${seedDir}`);
console.log(`labs-export: ${schemaFixtures.length} golden files → ${goldenDir}`);
