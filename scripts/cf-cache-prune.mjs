#!/usr/bin/env node
/**
 * Deletes stale OpenNext page-cache entries from the R2 bucket after a deploy.
 *
 * The R2 incremental cache stores every page under `incremental-cache/<BUILD_ID>/…`, and each deploy
 * populates a full copy under its new build id. The Worker only ever reads its own build id, so older
 * copies are dead weight (~80 MB per deploy, more for the first one). This keeps the current build
 * (`.next/BUILD_ID`) plus the most recently written other builds (CF_CACHE_KEEP, default 2 in total,
 * so `wrangler rollback` to the previous version still starts with a warm cache) and deletes the rest.
 *
 * Usage (runs at the end of `npm run cf:deploy`):
 *   node scripts/cf-cache-prune.mjs [--dry-run]
 *
 * Environment (never put these in a .env* file: OpenNext bundles .env* files into the Worker):
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY   R2 API token with write access to the bucket
 *   CLOUDFLARE_ACCOUNT_ID                    account that owns the bucket
 *   CF_CACHE_BUCKET                          default: the NEXT_INC_CACHE_R2_BUCKET bucket in wrangler.jsonc
 *   CF_CACHE_KEEP                            builds to keep including the current one (default 2, min 1)
 *
 * Missing credentials only print a warning: pruning never fails a deploy.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AwsClient } from "aws4fetch";

const PREFIX = "incremental-cache/";
const dryRun = process.argv.includes("--dry-run");
const root = process.cwd();

function log(message) {
  console.log(`cf-cache-prune: ${message}`);
}

function bucketFromWrangler() {
  const file = resolve(root, "wrangler.jsonc");
  if (!existsSync(file)) return null;
  const match = readFileSync(file, "utf8").match(
    /"binding"\s*:\s*"NEXT_INC_CACHE_R2_BUCKET"\s*,\s*"bucket_name"\s*:\s*"([^"]+)"/,
  );
  return match?.[1] ?? null;
}

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID } = process.env;
const bucket = process.env.CF_CACHE_BUCKET || bucketFromWrangler();
const keep = Math.max(1, Number.parseInt(process.env.CF_CACHE_KEEP ?? "2", 10) || 2);
const buildIdFile = resolve(root, ".next/BUILD_ID");

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !CLOUDFLARE_ACCOUNT_ID || !bucket) {
  log("skipped (set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and CLOUDFLARE_ACCOUNT_ID to prune old builds)");
  process.exit(0);
}
if (!existsSync(buildIdFile)) {
  log("skipped (.next/BUILD_ID not found; run after a build)");
  process.exit(0);
}
const currentBuild = readFileSync(buildIdFile, "utf8").trim();

const endpoint = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}`;
const s3 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const xmlValues = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, "g"))].map((m) => m[1]);
const unescapeXml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** @returns {Promise<Map<string, {keys: string[], bytes: number, newest: number}>>} */
async function listBuilds() {
  const builds = new Map();
  let token;
  do {
    const url = new URL(endpoint);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", PREFIX);
    url.searchParams.set("max-keys", "1000");
    if (token) url.searchParams.set("continuation-token", token);
    const res = await s3.fetch(url);
    const xml = await res.text();
    if (!res.ok) throw new Error(`list failed (${res.status}): ${xml.slice(0, 200)}`);
    for (const item of xml.split("<Contents>").slice(1)) {
      const key = unescapeXml(xmlValues(item, "Key")[0] ?? "");
      const build = key.slice(PREFIX.length).split("/")[0];
      if (!build) continue;
      const entry = builds.get(build) ?? { keys: [], bytes: 0, newest: 0 };
      entry.keys.push(key);
      entry.bytes += Number(xmlValues(item, "Size")[0] ?? 0);
      entry.newest = Math.max(entry.newest, Date.parse(xmlValues(item, "LastModified")[0] ?? "") || 0);
      builds.set(build, entry);
    }
    token = xmlValues(xml, "IsTruncated")[0] === "true" ? unescapeXml(xmlValues(xml, "NextContinuationToken")[0]) : undefined;
  } while (token);
  return builds;
}

async function deleteKeys(keys) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>true</Quiet>${batch
      .map((k) => `<Object><Key>${escapeXml(k)}</Key></Object>`)
      .join("")}</Delete>`;
    const url = new URL(endpoint);
    url.searchParams.set("delete", "");
    const res = await s3.fetch(url, {
      method: "POST",
      body,
      headers: { "content-type": "application/xml", "content-md5": createHash("md5").update(body).digest("base64") },
    });
    const text = await res.text();
    if (!res.ok || text.includes("<Error>")) throw new Error(`delete failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

try {
  const builds = await listBuilds();
  if (!builds.has(currentBuild)) {
    // The deploy populates the cache before this runs; an absent current build means something else
    // is off (wrong bucket or build dir), so delete nothing.
    log(`current build ${currentBuild} has no cache entries in ${bucket}; nothing deleted`);
    process.exit(0);
  }
  const others = [...builds.entries()].filter(([id]) => id !== currentBuild).sort((a, b) => b[1].newest - a[1].newest);
  const kept = [currentBuild, ...others.slice(0, keep - 1).map(([id]) => id)];
  const stale = others.slice(keep - 1);
  const staleKeys = stale.flatMap(([, entry]) => entry.keys);
  const staleBytes = stale.reduce((sum, [, entry]) => sum + entry.bytes, 0);
  log(`bucket ${bucket}: ${builds.size} build(s); keeping ${kept.join(", ")}`);
  if (!stale.length) {
    log("nothing to prune");
  } else if (dryRun) {
    log(`dry run: would delete ${stale.length} build(s), ${staleKeys.length} objects, ${mb(staleBytes)}`);
  } else {
    await deleteKeys(staleKeys);
    log(`deleted ${stale.length} build(s), ${staleKeys.length} objects, ${mb(staleBytes)}`);
  }
} catch (error) {
  log(`failed, nothing more deleted: ${error instanceof Error ? error.message : error}`);
  process.exit(0);
}
