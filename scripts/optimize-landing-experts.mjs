#!/usr/bin/env node
/**
 * Regenerates the landing hero portraits as small local WebP files.
 *
 * The landing hero used to point <img> at the legacy host's 500–800 KB PNG uploads: 54 eager
 * elements, ~5.4 MB before first paint. The portraits are decorative and never need more than a
 * ~480 px card, so they are fetched once, cropped to the 600:811 design box and committed under
 * public/landing/experts/. `npm run assets:experts` refreshes them if the curated line-up changes.
 *
 * Source URLs are kept here (not in the content module) so regenerating never depends on the
 * already-rewritten local paths in features/landing/content/experts.ts.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const SOURCES = [
  ["thabet-hegazy", "https://live.emasteryacademy.com/uploads/9dd4f2e5-a520-4adc-ac4b-66b6c008db07.png"],
  ["sahl-mahdi", "https://live.emasteryacademy.com/uploads/8ea140f3-589b-40c4-a7b3-2360adbbe14c.png"],
  ["huthaifa-hegazy", "https://live.emasteryacademy.com/uploads/bea43b9b-c67c-41a2-a60c-d8cef3375c19.jpeg"],
  ["nashmi-alharbi", "https://live.emasteryacademy.com/uploads/d9d66bac-3c0c-4086-b742-9b2c538148c0.png"],
  ["fatima-belhaddad", "https://live.emasteryacademy.com/uploads/13ee2ffa-f0e8-4f5b-9d9e-44aaf4279f04.png"],
  ["marwa-alsharaa", "https://live.emasteryacademy.com/uploads/c706fa3d-21b0-4cbb-89fc-b3c4c77f72de.png"],
  ["mazhar-kantakji", "https://live.emasteryacademy.com/uploads/f76209e6-e5b1-45f3-91e5-096c414c082a.png"],
  ["ahmed-aljarhi", "https://live.emasteryacademy.com/uploads/141fceac-73be-44f9-9641-5ac151dd4ea5.png"],
  ["mohammed-alzubaidi", "https://live.emasteryacademy.com/uploads/f0b31ae2-fc5e-4421-9635-48c9b12fec8c.png"],
];

/** Displayed aspect (the design's card is 600 × 811). */
const RATIO = 600 / 811;
const WIDTHS = [256, 480];

async function fetchBytes(url, attempt = 1) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    return fetchBytes(url, attempt + 1);
  }
}

const outDir = resolve(process.cwd(), "public/landing/experts");
await mkdir(outDir, { recursive: true });

let total = 0;
for (const [id, url] of SOURCES) {
  const source = await fetchBytes(url);
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error(`${id}: source has no dimensions`);

  for (const width of WIDTHS) {
    const height = Math.round(width / RATIO);
    const output = await sharp(source)
      .resize({ width, height, fit: "cover", position: "top" })
      .webp({ quality: 70, effort: 4 })
      .toBuffer();
    const file = resolve(outDir, `${id}-${width}.webp`);
    await writeFile(file, output);
    total += output.length;
    console.log(`${id}-${width}.webp  ${width}×${height}  ${(output.length / 1024).toFixed(1)} KB`);
  }
}

console.log(`\n${SOURCES.length * WIDTHS.length} files, ${(total / 1024).toFixed(0)} KB total → ${dirname(resolve(outDir, "x"))}`);
