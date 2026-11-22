/**
 * Port bespoke labs to the data-driven `dialogue` runtime and write the backend seeds + fixtures.
 *
 *   npx tsx scripts/labs-port.ts [--out ../newwebsitebackend] [--check]
 *
 * For each port (scripts/labs-ports/*.ts):
 * - `app/modules/labs/seed/engines/<engine>.json`   the admin engine (context, meters, rubric…)
 * - `app/modules/labs/seed/personas/<key>.json`     library personas
 * - `app/modules/labs/seed/<slug>.json`             the lab bundle, now on the engine with a real
 *                                                   scenario document instead of `bundled_slug`
 * - `tests/fixtures/labs/dialogue/<slug>.json`      golden runs scored by the bespoke scorer,
 *                                                   which the Python rubric must reproduce
 * The generic TS runtime is checked against the bespoke engine on every golden path first.
 * `--check` validates without writing.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { validateStage, type DialogueStageDoc } from "../src/features/labs/model/dialogue-runtime";
import type { Port } from "./labs-ports/common";
import { hrPort } from "./labs-ports/hr";
import { salesPort } from "./labs-ports/sales";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const backend = resolve(outIndex >= 0 ? args[outIndex + 1] : "../newwebsitebackend");
const check = args.includes("--check");
const seedDir = join(backend, "app/modules/labs/seed");
const fixtureDir = join(backend, "tests/fixtures/labs/dialogue");

const ports: (() => Port)[] = [salesPort, hrPort];

function write(path: string, value: unknown) {
  if (check) return;
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

for (const build of ports) {
  const port = build();
  const problems = port.scenario.stages
    .filter((stage): stage is DialogueStageDoc => stage.type === "dialogue")
    .flatMap((stage) => validateStage(port.scenario, stage));
  if (problems.length) throw new Error(`${port.slug}: ${problems.join("; ")}`);

  // New labs on the engine start from the ported scenario (a complete, valid example).
  port.engine.definition.starter_scenario = port.scenario;
  write(join(seedDir, "engines", `${port.engine.card.key}.json`), port.engine);
  for (const persona of port.personas) write(join(seedDir, "personas", `${persona.key}.json`), { format: "mastery-lab-persona", format_version: 1, ...persona });

  const bundlePath = join(seedDir, `${port.slug}.json`);
  if (!existsSync(bundlePath)) throw new Error(`${port.slug}: no seed bundle at ${bundlePath} (run labs-export first)`);
  const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
  bundle.card.engine_key = "dialogue";
  bundle.card.engine = port.engine.card.key;
  bundle.scenarios = bundle.scenarios.map((scenario: { key: string }) =>
    scenario.key === port.scenarioKey ? { ...scenario, schema_version: 1, content: port.scenario } : scenario,
  );
  write(bundlePath, bundle);

  write(join(fixtureDir, `${port.slug}.json`), {
    slug: port.slug,
    engine: port.engine,
    personas: port.personas,
    scenario: port.scenario,
    cases: port.cases,
  });
  const outcomes = port.cases.reduce<Record<string, number>>((acc, item) => {
    const key = item.name.split("-").pop() ?? "?";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`${check ? "checked" : "ported "} ${port.slug} → engine ${port.engine.card.key}: ${port.cases.length} golden runs ${JSON.stringify(outcomes)}`);
}
