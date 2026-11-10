#!/usr/bin/env node
/**
 * Local Lighthouse runner for the storefront.
 *
 * Usage:
 *   npm run perf:mobile                    # / on http://localhost:3001
 *   npm run perf:desktop
 *   node scripts/lighthouse.mjs --preset=mobile --routes=/,/search,/live
 *   node scripts/lighthouse.mjs --url=http://localhost:3001/courses/4 --no-fail
 *
 * It expects a production build served by `next start` (not the dev server): dev bundles are not
 * representative, and the point of the run is the shipped JavaScript and image payload.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  args.set(key, value);
}

const baseUrl = (args.get("url") ?? "http://localhost:3001").replace(/\/+$/, "");
const preset = args.get("preset") === "desktop" ? "desktop" : "mobile";
const routes = (args.get("routes") ?? "/")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const outDir = resolve(process.cwd(), args.get("out") ?? "lighthouse", preset);
const fail = !args.has("no-fail");

const THRESHOLDS = {
  mobile: { performance: 0.9, fcp: 1800, lcp: 2500, tbt: 200, cls: 0.1 },
  desktop: { performance: 0.95, fcp: 1000, lcp: 1500, tbt: 150, cls: 0.1 },
};

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));

function lighthouseBinary() {
  const probe = spawnSync("lighthouse", ["--version"], { encoding: "utf8" });
  if (probe.status === 0) return "lighthouse";
  return "npx";
}

const binary = lighthouseBinary();

function run(route) {
  const url = route.startsWith("http") ? route : `${baseUrl}${route}`;
  const slug = route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const outputPath = resolve(outDir, slug);
  const cliArgs = [
    url,
    "--only-categories=performance,seo",
    `--output=json`,
    `--output=html`,
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
    "--quiet",
    "--max-wait-for-load=90000",
  ];
  if (preset === "desktop") cliArgs.push("--preset=desktop");

  const command = binary === "npx" ? ["--yes", "lighthouse@13.5.0", ...cliArgs] : cliArgs;
  console.log(`\n▶ ${preset}  ${url}`);
  const result = spawnSync(binary, command, {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) },
  });
  if (result.status !== 0) throw new Error(`lighthouse exited with ${result.status}`);

  return { url, slug, jsonPath: `${outputPath}.report.json` };
}

function ms(value) {
  return typeof value === "number" ? `${(value / 1000).toFixed(2)} s` : "—";
}

function score(value) {
  return typeof value === "number" ? Math.round(value * 100) : "—";
}

async function summarise({ url, jsonPath }) {
  const report = JSON.parse(await readFile(jsonPath, "utf8"));
  const { categories, audits } = report;
  const metrics = {
    performance: categories.performance?.score ?? null,
    seo: categories.seo?.score ?? null,
    fcp: audits["first-contentful-paint"]?.numericValue ?? null,
    lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
    tbt: audits["total-blocking-time"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    si: audits["speed-index"]?.numericValue ?? null,
  };
  const lcpElement = audits["largest-contentful-paint-element"]?.details?.items?.[1]?.items?.[0]
    ?? audits["lcp-breakdown-insight"]?.details?.items?.find?.((item) => item.type === "node");
  return { url, metrics, lcpElement };
}

function check(metrics) {
  const limits = THRESHOLDS[preset];
  const failures = [];
  if (metrics.performance === null || metrics.performance < limits.performance) {
    failures.push(`performance ${score(metrics.performance)} < ${Math.round(limits.performance * 100)}`);
  }
  if (metrics.lcp === null || metrics.lcp > limits.lcp) failures.push(`LCP ${ms(metrics.lcp)} > ${ms(limits.lcp)}`);
  if (metrics.tbt === null || metrics.tbt > limits.tbt) failures.push(`TBT ${Math.round(metrics.tbt)} > ${limits.tbt} ms`);
  if (metrics.fcp === null || metrics.fcp > limits.fcp) failures.push(`FCP ${ms(metrics.fcp)} > ${ms(limits.fcp)}`);
  if (metrics.cls === null || metrics.cls > limits.cls) failures.push(`CLS ${metrics.cls} > ${limits.cls}`);
  return failures;
}

await mkdir(outDir, { recursive: true });
const results = [];
for (const route of routes) {
  const output = await run(route);
  results.push(await summarise(output));
}

console.log(`\n${preset.toUpperCase()} — ${baseUrl}`);
console.log(
  ["route".padEnd(28), "perf", "seo", "FCP", "LCP", "TBT", "CLS", "SI"].join("  "),
);
let failed = false;
for (const { url, metrics } of results) {
  const failures = fail ? check(metrics) : [];
  if (failures.length > 0) failed = true;
  const route = url.replace(baseUrl, "") || "/";
  console.log(
    [
      route.padEnd(28),
      String(score(metrics.performance)).padStart(4),
      String(score(metrics.seo)).padStart(3),
      ms(metrics.fcp).padStart(7),
      ms(metrics.lcp).padStart(7),
      `${Math.round(metrics.tbt ?? 0)} ms`.padStart(7),
      String(metrics.cls?.toFixed(3) ?? "—").padStart(5),
      ms(metrics.si).padStart(7),
    ].join("  "),
  );
  if (failures.length > 0) console.log(`  ✗ ${failures.join("; ")}`);
}

const limits = THRESHOLDS[preset];
console.log(
  `\nTargets (${preset}): perf ≥ ${Math.round(limits.performance * 100)}, LCP ≤ ${ms(limits.lcp)}, TBT ≤ ${limits.tbt} ms, FCP ≤ ${ms(limits.fcp)}, CLS ≤ ${limits.cls}`,
);
console.log(`Reports: ${outDir}`);

if (fail && failed) process.exit(1);
