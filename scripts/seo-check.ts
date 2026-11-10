/**
 * SEO/GEO regression guard. Run against a production server:
 *
 *   npm run build && npm run start          # in one terminal
 *   npm run seo:check                       # in another (SEO_CHECK_URL defaults to http://localhost:3000)
 *
 * Checks what crawlers and AI bots get without JavaScript: status codes, head tags, one H1,
 * parseable JSON-LD, the crawl files, and (sampled) every page type listed in sitemap.xml.
 * Exits non-zero on any failure.
 */

const baseUrl = (process.env.SEO_CHECK_URL ?? "http://localhost:3000").replace(/\/$/, "");
// Staging runs set NEXT_PUBLIC_ENV=staging and expect noindex instead.
const expectIndexable = (process.env.NEXT_PUBLIC_ENV ?? "production") === "production";
// Checking all ~600 product URLs is slow; the default samples each kind. Set SEO_CHECK_FULL=1 for all.
const fullRun = process.env.SEO_CHECK_FULL === "1";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// The local backend rate-limits bursts; checking dozens of pages back-to-back can trip it.
const requestDelay = Number(process.env.SEO_CHECK_DELAY_MS ?? 200);

async function get(path: string, userAgent = "Googlebot") {
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${baseUrl}${path}`, { headers: { "User-Agent": userAgent }, redirect: "manual" });
    if (response.status !== 429) break;
    await sleep(1500 * (attempt + 1));
  }
  if (!response) throw new Error(`no response for ${path}`);
  return { response, text: await response.text() };
}

function metaContent(html: string, attr: "name" | "property", key: string): string | null {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*>`, "i"))?.[0];
  return tag?.match(/content="([^"]*)"/i)?.[1] ?? null;
}

function canonicalOf(html: string): string | null {
  return html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1] ?? null;
}

function titleOf(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
}

function ldTypes(html: string): { types: Set<string>; parsed: boolean } {
  const types = new Set<string>();
  let parsed = true;
  for (const [, block] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(block) as { "@graph"?: { "@type"?: string | string[] }[] };
      for (const node of data["@graph"] ?? []) {
        const type = node["@type"];
        if (Array.isArray(type)) type.forEach((item) => types.add(item));
        else if (type) types.add(type);
      }
    } catch {
      parsed = false;
    }
  }
  return { types, parsed };
}

function absoluteImage(html: string, attr: "name" | "property", key: string): string | null {
  const value = metaContent(html, attr, key)?.replace(/&amp;/g, "&") ?? null;
  if (!value) return null;
  return /^https?:\/\//.test(value) ? value : null;
}

async function checkHome() {
  console.log("/ (as GPTBot — no JavaScript)");
  const { response, text: html } = await get("/", "GPTBot");
  check("status 200", response.status === 200, `got ${response.status}`);
  check('<html lang="ar" dir="rtl">', /<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html));

  const title = titleOf(html);
  check("title present", title.length > 0);
  const description = metaContent(html, "name", "description") ?? "";
  check("meta description present", description.length > 0);
  check("canonical is absolute", /^https?:\/\//.test(canonicalOf(html) ?? ""), canonicalOf(html) ?? "missing");

  const robots = metaContent(html, "name", "robots") ?? "";
  check(
    expectIndexable ? "no noindex in production" : "noindex outside production",
    expectIndexable ? !/noindex/i.test(robots) : /noindex/i.test(robots),
    robots,
  );

  // Budgets used by Google and the social preview debuggers (character counts).
  check("title ≤ 60 chars", [...title].length <= 60, `${[...title].length}`);
  check("meta description ≤ 160 chars", [...description].length <= 160, `${[...description].length}`);
  const ogDescription = metaContent(html, "property", "og:description") ?? "";
  check("og:description ≤ 125 chars", ogDescription.length > 0 && [...ogDescription].length <= 125, `${[...ogDescription].length}`);
  check("og:url present", Boolean(metaContent(html, "property", "og:url")));
  check("og:site_name present", Boolean(metaContent(html, "property", "og:site_name")));
  check("twitter:card present", Boolean(metaContent(html, "name", "twitter:card")));

  // Share previews break when metadataBase points at a host that doesn't serve this app: the image
  // URL then answers with some other site's HTML. Fetch what the tags actually advertise.
  for (const [attr, key] of [["property", "og:image"], ["name", "twitter:image"]] as const) {
    const url = absoluteImage(html, attr, key);
    if (!url) {
      check(`${key} present and absolute`, false, "missing or relative");
      continue;
    }
    const image = await fetch(url).catch(() => null);
    const type = image?.headers.get("content-type") ?? "";
    check(`${key} URL returns an image`, Boolean(image?.ok) && type.startsWith("image/"), `${url} → ${image?.status ?? "unreachable"} ${type}`);
  }
  check("manifest linked", /<link[^>]*rel="manifest"/.test(html));

  const h1Count = html.match(/<h1[\s>]/g)?.length ?? 0;
  check("exactly one <h1>", h1Count === 1, `found ${h1Count}`);
  check("FAQ answers in the HTML", html.includes("أكاديمية ماستري منصة عربية"));

  const { types, parsed } = ldTypes(html);
  check("JSON-LD present", types.size > 0);
  check("JSON-LD parses", parsed);
  for (const type of ["EducationalOrganization", "WebSite", "WebPage", "FAQPage"]) {
    check(`JSON-LD has ${type}`, types.has(type));
  }
}

/** Expected structured data per route pattern; first match wins. */
const EXPECTED: { test: RegExp; types: string[] }[] = [
  { test: /^\/$/, types: ["EducationalOrganization", "WebSite", "WebPage", "FAQPage"] },
  { test: /^\/search/, types: ["CollectionPage"] },
  { test: /^\/live\/[^/]+$/, types: ["Course", "BreadcrumbList"] },
  { test: /^\/live$/, types: ["CollectionPage", "BreadcrumbList"] },
  { test: /^\/experts\/[^/]+$/, types: ["ProfilePage", "Person"] },
  { test: /^\/experts$/, types: ["CollectionPage", "BreadcrumbList"] },
  { test: /^\/business\/b2b$/, types: ["Service", "FAQPage"] },
  { test: /^\/business$/, types: ["Service", "FAQPage"] },
  { test: /^\/blog\/authors\/[^/]+$/, types: ["ProfilePage", "Person"] },
  { test: /^\/blog\/authors$/, types: ["CollectionPage", "Person"] },
  { test: /^\/blog\/[^/]+$/, types: ["Article", "BreadcrumbList"] },
  { test: /^\/blog$/, types: ["Blog", "BreadcrumbList"] },
  { test: /^\/trainers$/, types: ["Service", "FAQPage"] },
  { test: /^\/subscriptions$/, types: ["ItemList"] },
  { test: /^\/marketers$/, types: ["Service"] },
  { test: /^\/verify$/, types: ["WebPage"] },
  { test: /^\/(terms|privacy)$/, types: ["WebPage"] },
  { test: /^\/(courses|diplomas)\/[^/]+$/, types: ["Course", "BreadcrumbList"] },
  { test: /^\/(packages|bundles)\/[^/]+$/, types: ["Product", "BreadcrumbList"] },
  { test: /^\/consultations\/[^/]+$/, types: ["Service", "BreadcrumbList"] },
];

function expectedFor(pathname: string): string[] {
  return EXPECTED.find((entry) => entry.test.test(pathname))?.types ?? [];
}

/** A representative subset of the sitemap when not doing a full run. */
function sample(urls: string[]): string[] {
  if (fullRun) return urls;
  const groups = new Map<string, string[]>();
  for (const url of urls) {
    const { pathname } = new URL(url);
    const kind = pathname
      .replace(/^\/courses\/[^/]+$/, "/courses/:slug")
      .replace(/^\/diplomas\/[^/]+$/, "/diplomas/:slug")
      .replace(/^\/packages\/[^/]+$/, "/packages/:slug")
      .replace(/^\/bundles\/[^/]+$/, "/bundles/:slug")
      .replace(/^\/consultations\/[^/]+$/, "/consultations/:slug")
      .replace(/^\/blog\/authors\/[^/]+$/, "/blog/authors/:slug")
      .replace(/^\/blog\/[^/]+$/, "/blog/:slug")
      .replace(/^\/experts\/[^/]+$/, "/experts/:slug")
      .replace(/^\/live\/[^/]+$/, "/live/:slug");
    const bucket = groups.get(kind) ?? [];
    bucket.push(url);
    groups.set(kind, bucket);
  }
  return [...groups.values()].flatMap((bucket) => bucket.slice(0, 3));
}

async function checkSitemapPages() {
  console.log("\nSitemap page types (as GPTBot)");
  const sitemap = await get("/sitemap.xml");
  check("/sitemap.xml 200", sitemap.response.status === 200);
  const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  check("sitemap has URLs", urls.length > 0, `${urls.length}`);
  check("sitemap has <lastmod>", sitemap.text.includes("<lastmod>"));
  check("sitemap uses xhtml alternates", sitemap.text.includes('hreflang="ar"'));

  for (const url of sample(urls)) {
    const path = url.replace(baseUrl, "") || "/";
    await sleep(requestDelay);
    const { response, text: html } = await get(path, "GPTBot");
    if (response.status === 429) {
      console.log(`  (skipped ${path}: backend rate limit)`);
      continue;
    }
    if (response.status !== 200) {
      check(`${path} status 200`, false, `got ${response.status}`);
      continue;
    }
    const canonical = canonicalOf(html) ?? "";
    const canonicalPath = canonical.replace(baseUrl, "") || "/";
    check(`${path} canonical is self`, canonical.startsWith("http") && canonicalPath === path, canonical || "missing");
    check(`${path} exactly one <h1>`, (html.match(/<h1[\s>]/g)?.length ?? 0) === 1);
    const title = titleOf(html);
    const description = metaContent(html, "name", "description") ?? "";
    check(`${path} title present`, title.length > 0);
    check(`${path} description present`, description.length > 0);
    check(`${path} og:image present`, Boolean(absoluteImage(html, "property", "og:image")));
    check(`${path} twitter:image present`, Boolean(absoluteImage(html, "name", "twitter:image")));
    const { types, parsed } = ldTypes(html);
    check(`${path} JSON-LD parses`, parsed);
    for (const type of expectedFor(new URL(url).pathname)) {
      check(`${path} JSON-LD has ${type}`, types.has(type), [...types].join(", "));
    }
  }
}

async function checkFiles() {
  console.log("\nCrawl files");
  const robots = await get("/robots.txt");
  check("/robots.txt 200", robots.response.status === 200);
  if (expectIndexable) {
    check("robots.txt references the sitemap", /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots.text));
    check("robots.txt allows AI search bots", /User-Agent: OAI-SearchBot/i.test(robots.text));
    for (const path of ["/expert/", "/marketer/", "/preview/", "/egress/", "/students/"]) {
      check(`robots.txt disallows ${path}`, robots.text.includes(`Disallow: ${path}`));
    }
  }

  const llms = await get("/llms.txt");
  check("/llms.txt 200", llms.response.status === 200);
  check("llms.txt starts with a title", llms.text.startsWith("# "));
  check("llms.txt links the sitemap", llms.text.includes("/sitemap.xml"));
  check("llms.txt links the feed", llms.text.includes("/feed.xml"));

  const feed = await get("/feed.xml");
  check("/feed.xml 200", feed.response.status === 200);
  check("feed.xml is RSS", feed.text.includes('<rss version="2.0"'));
  check("feed.xml has items", feed.text.includes("<item>"));

  const manifest = await get("/manifest.webmanifest");
  check("/manifest.webmanifest 200", manifest.response.status === 200);

  const og = await fetch(`${baseUrl}/opengraph-image.jpg`);
  check("/opengraph-image.jpg 200", og.status === 200 && (og.headers.get("content-type") ?? "").startsWith("image/"));

  const missing = await get("/this-page-does-not-exist");
  check("unknown URL returns a real 404", missing.response.status === 404, `got ${missing.response.status}`);
}

async function main() {
  console.log(`SEO check against ${baseUrl} (expect ${expectIndexable ? "indexable" : "noindex"}, ${fullRun ? "full" : "sampled"} sitemap)`);
  await checkHome();
  await checkSitemapPages();
  await checkFiles();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
