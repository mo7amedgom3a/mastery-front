import type { MetadataRoute } from "next";

import { getSiteUrl, isIndexable } from "@/config/env";

// Per-visitor pages (also noindexed in their metadata) have nothing for a crawler.
const PRIVATE_PATHS = ["/api/", "/students/", "/cart", "/wishlist", "/checkout/"];

/**
 * AI crawlers are allowed on purpose (business decision: maximum visibility in AI answers and
 * assistants, including training crawlers). Listed explicitly so the policy is visible and easy to
 * change per bot. A bot that matches a named group ignores `*`, hence the repeated disallows.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  // Staging / previews: keep everything out of search indexes.
  if (!isIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
