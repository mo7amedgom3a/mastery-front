---
name: seo
description: Search Engine Optimization for web apps (Next.js, React, content sites) — technical SEO, metadata, Open Graph, structured data/JSON-LD, crawlability, Core Web Vitals, sitemaps/robots, and on-page content signals. Use when adding meta tags, fixing indexing, improving rankings/CTR, setting up sitemap.xml/robots.txt, or the user asks about SEO, SERP snippets, or Google Search Console issues.
---

# SEO (Search Engine Optimization)

Make pages **discoverable, understandable, and preferable** to search crawlers — technical foundations first, then on-page clarity. Applies to Next.js App/Pages Router, Remix, and SPA+SSR setups.

## Core principle

Crawlers reward **clear HTML content**, **fast stable pages**, and **honest intent matching** — not keyword stuffing or cloaking. If a human can't tell what the page is about from the title/H1/first paragraph, neither can Google.

---

## 1. Technical SEO (must-haves)

- **SSR/SSG for indexable routes** — don't rely on client-only rendering for content you want ranked. Prefer Next.js `generateMetadata`, server components, or static generation for marketing/docs/product pages.
- Unique **`<title>`** and **meta description** per URL — title ~50–60 chars of primary intent; description sells the click (not stuffed).
- One clear **H1** per page; heading hierarchy H1 → H2 → H3 without skipping for style.
- **Canonical** URL on every indexable page (`rel="canonical"`) to prevent duplicate-content splits (trailing slash, `www`, query variants, HTTP/HTTPS).
- Clean URLs: readable slugs, lowercase, hyphens; avoid session ids in indexable URLs.
- **`robots.txt`** — allow important paths; disallow admin, APIs, preview, cart/checkout internals as needed.
- **XML sitemap** — list canonical indexable URLs; submit in Search Console; keep updated on deploy/content change.
- Correct **status codes**: 200 for live, 301 for permanent moves, 404/410 for gone — never soft-404 (200 with "not found" body).
- **hreflang** when you have true language/region variants; each locale points at itself and siblings.
- HTTPS everywhere; fix mixed content.

### Next.js metadata (App Router sketch)

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  const url = `https://example.com/blog/${post.slug}`
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.excerpt, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  }
}
```

---

## 2. On-page & content signals

- Primary topic obvious in title, H1, first screen of content, and URL slug — aligned, not identical spam.
- Useful body content: answer the query; use descriptive subheads; prefer real examples over fluff.
- Internal links with descriptive anchors (not "click here"); surface important pages from hub pages.
- Image **alt** text that describes the image; compress and set dimensions (CWV + a11y).
- Don't hide primary content behind tabs/JS that crawlers can't see without rendering — if you must, ensure SSR still emits the text.

---

## 3. Structured data (JSON-LD)

Add schema that matches visible content — never mark up claims the page doesn't show.

Common types: `Organization`, `WebSite` (+ `SearchAction` if you have site search), `Article`/`BlogPosting`, `Product`, `FAQPage`, `BreadcrumbList`, `HowTo`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "…",
  "datePublished": "2026-01-15",
  "author": { "@type": "Person", "name": "…" }
}
</script>
```

Validate with Google Rich Results Test / Schema Markup Validator after shipping.

---

## 4. Social / link previews

- Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter/X cards: `summary_large_image` when you have a strong image
- Absolute image URLs; recommended ~1200×630; keep file size reasonable

---

## 5. Performance as SEO (Core Web Vitals)

- **LCP** — optimize hero image/font; prioritize above-the-fold; avoid late-loading titles.
- **INP** — keep main thread free; break up heavy JS (ties to react-performance skill).
- **CLS** — size images/embeds; reserve space for fonts/ads; avoid inserting content above existing content post-load.
- Ship less client JS on marketing pages; prefer static/server HTML for content sites.

---

## 6. Crawl budget & hygiene

- Paginate or noindex infinite filter/facet URLs that explode combinations (`?color=&size=&sort=`).
- `noindex` thank-you, account, staging, and thin parameter pages when appropriate.
- Avoid doorway pages and duplicate boilerplate across thousands of URLs.
- Monitor Coverage / Indexing in Search Console; fix "crawled – currently not indexed" by improving quality/uniqueness, not by spamming resubmits.

---

## Checklist

- [ ] Indexable routes are SSR/SSG with unique title, description, canonical, H1
- [ ] `robots.txt` + XML sitemap present and sane
- [ ] Status codes and redirects correct; no soft-404s
- [ ] JSON-LD matches visible content; OG/Twitter tags set
- [ ] Images have alt + dimensions; CWV not tanked by hero/JS
- [ ] Internal linking connects important pages; faceted junk controlled with noindex/canonical
