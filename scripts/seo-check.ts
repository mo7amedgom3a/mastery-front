/**
 * SEO/GEO regression guard. Run against a production server:
 *
 *   npm run build && npm run start          # in one terminal
 *   npm run seo:check                       # in another (SEO_CHECK_URL defaults to http://localhost:3000)
 *
 * Checks what crawlers and AI bots get without JavaScript: status codes, head tags, one H1,
 * parseable JSON-LD, and the crawl files. Exits non-zero on any failure.
 */

const baseUrl = (process.env.SEO_CHECK_URL ?? "http://localhost:3000").replace(/\/$/, "");
// Staging runs set NEXT_PUBLIC_ENV=staging and expect noindex instead.
const expectIndexable = (process.env.NEXT_PUBLIC_ENV ?? "production") === "production";

const failures: string[] = [];
let passed = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path: string, userAgent = "Googlebot") {
  const response = await fetch(`${baseUrl}${path}`, { headers: { "User-Agent": userAgent }, redirect: "manual" });
  return { response, text: await response.text() };
}

function metaContent(html: string, attr: "name" | "property", key: string): string | null {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*>`, "i"))?.[0];
  return tag?.match(/content="([^"]*)"/i)?.[1] ?? null;
}

async function checkHome() {
  console.log("/ (as GPTBot — no JavaScript)");
  const { response, text: html } = await get("/", "GPTBot");
  check("status 200", response.status === 200, `got ${response.status}`);
  check('<html lang="ar" dir="rtl">', /<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html));

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  check("title present", title.length > 0);
  const description = metaContent(html, "name", "description") ?? "";
  check("meta description present", description.length > 0);

  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1] ?? "";
  check("canonical is absolute", /^https?:\/\//.test(canonical), canonical || "missing");

  const robots = metaContent(html, "name", "robots") ?? "";
  check(
    expectIndexable ? "no noindex in production" : "noindex outside production",
    expectIndexable ? !/noindex/i.test(robots) : /noindex/i.test(robots),
    robots,
  );

  check("og:image present", Boolean(metaContent(html, "property", "og:image")));
  check("twitter:card present", Boolean(metaContent(html, "name", "twitter:card")));
  check("manifest linked", /<link[^>]*rel="manifest"/.test(html));

  const h1Count = html.match(/<h1[\s>]/g)?.length ?? 0;
  check("exactly one <h1>", h1Count === 1, `found ${h1Count}`);
  check("FAQ answers in the HTML", html.includes("أكاديمية ماستري منصة عربية"));

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  check("JSON-LD present", blocks.length > 0);
  const types = new Set<string>();
  for (const block of blocks) {
    try {
      const data = JSON.parse(block) as { "@graph"?: { "@type": string }[] };
      for (const node of data["@graph"] ?? []) types.add(node["@type"]);
    } catch (error) {
      check("JSON-LD parses", false, String(error));
    }
  }
  for (const type of ["EducationalOrganization", "WebSite", "WebPage", "FAQPage"]) {
    check(`JSON-LD has ${type}`, types.has(type));
  }
}

async function checkFiles() {
  console.log("Crawl files");
  const robots = await get("/robots.txt");
  check("/robots.txt 200", robots.response.status === 200);
  if (expectIndexable) {
    check("robots.txt references the sitemap", /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots.text));
    check("robots.txt allows AI search bots", /User-Agent: OAI-SearchBot/i.test(robots.text));
  }

  const sitemap = await get("/sitemap.xml");
  check("/sitemap.xml 200", sitemap.response.status === 200);
  check("sitemap has <lastmod>", sitemap.text.includes("<lastmod>"));

  const llms = await get("/llms.txt");
  check("/llms.txt 200", llms.response.status === 200);
  check("llms.txt starts with a title", llms.text.startsWith("# "));

  const manifest = await get("/manifest.webmanifest");
  check("/manifest.webmanifest 200", manifest.response.status === 200);

  const og = await fetch(`${baseUrl}/opengraph-image.jpg`);
  check("/opengraph-image.jpg 200", og.status === 200 && (og.headers.get("content-type") ?? "").startsWith("image/"));

  const missing = await get("/this-page-does-not-exist");
  check("unknown URL returns a real 404", missing.response.status === 404, `got ${missing.response.status}`);
}

async function main() {
  console.log(`SEO check against ${baseUrl} (expect ${expectIndexable ? "indexable" : "noindex"})\n`);
  await checkHome();
  console.log("");
  await checkFiles();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
