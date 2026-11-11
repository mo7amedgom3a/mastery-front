#!/usr/bin/env node
/**
 * Production build for the Cloudflare Workers deployment (OpenNext).
 *
 * `next build` reads `.env.local`, and OpenNext compiles every `.env*` file it finds into the Worker
 * as fallback `process.env` values. A developer's `.env.local` (localhost API, local secrets) would
 * therefore end up in the production bundle. This wrapper hides `.env.local` for the duration of the
 * build, so only `.env.production.local` or the environment (build-time NEXT_PUBLIC_* values, no
 * secrets) is used, and restores it afterwards, even when the build fails.
 *
 * Runtime configuration comes from wrangler.jsonc `vars` and `wrangler secret`, never from env files.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const prodEnv = resolve(root, ".env.production.local");
const localEnv = resolve(root, ".env.local");
const hiddenLocalEnv = resolve(root, ".env.local.cf-build-hidden");

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ENV",
  "NEXT_ENABLE_IMAGE_OPTIMIZATION",
  // Build-time switch that drops the Node OTel SDK from the bundle (src/instrumentation.ts).
  "NEXT_PUBLIC_DEPLOY_TARGET",
];
// Build values come from .env.production.local (local deploys) or the environment (CI, see
// .github/workflows/cloudflare.yml); either way every required key must be set.
const prodEnvText = existsSync(prodEnv) ? readFileSync(prodEnv, "utf8") : "";
const missing = required.filter(
  (key) => !process.env[key]?.trim() && !new RegExp(`^${key}=.+`, "m").test(prodEnvText),
);
if (missing.length) {
  console.error(
    `cf-build: set ${missing.join(", ")} in .env.production.local or the environment (see README.md, Deploy (Cloudflare)).`,
  );
  process.exit(1);
}
if (existsSync(hiddenLocalEnv)) {
  console.error(`cf-build: ${hiddenLocalEnv} exists from an interrupted build; restore it to .env.local first.`);
  process.exit(1);
}

const hid = existsSync(localEnv);
if (hid) renameSync(localEnv, hiddenLocalEnv);
const restore = () => {
  if (hid && existsSync(hiddenLocalEnv)) renameSync(hiddenLocalEnv, localEnv);
};
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restore();
    process.exit(130);
  });
}

let status = 1;
try {
  const result = spawnSync("npx", ["opennextjs-cloudflare", "build", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=6144" },
  });
  status = result.status ?? 1;
} finally {
  restore();
}

// Browser source maps exist only for the Faro upload (next.config.ts), which removes them when
// FARO_API_KEY is set; without the key they would be uploaded as public static assets. Never serve them.
if (status === 0) {
  const assets = resolve(root, ".open-next/assets");
  const maps = existsSync(assets)
    ? readdirSync(assets, { recursive: true }).filter((file) => String(file).endsWith(".map"))
    : [];
  for (const file of maps) rmSync(resolve(assets, String(file)));
  console.log(`cf-build: removed ${maps.length} source map(s) from the static assets.`);
}
process.exit(status);
