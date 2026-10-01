import type { NextConfig } from "next";
import { isIndexable } from "./src/config/env";

// Buckets the legacy backend serves product imagery from, plus the site's own upload host.
const s3Buckets = ["course", "curriculum", "consultant", "category", "instructor", "trainer"].map((bucket) => ({
  protocol: "https" as const,
  hostname: "s3.eu-west-1.amazonaws.com",
  pathname: `/${bucket}.emasteryacademy.com/**`,
}));

// Bunny Stream thumbnails for promo-video posters (the library's CDN host, see .env.example).
const bunnyCdnHostname = process.env.BUNNY_CDN_HOSTNAME?.trim();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Sign-in forms and the session endpoints must never be shown inside another site's frame (clickjacking).
const noFraming = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Trainer profiles moved to the expert page; the trainer id is the expert key.
      { source: "/instructors/:id", destination: "/experts/:id", permanent: true },
      // One listing for every product type: the search page, filtered. Sources match the bare
      // path only, so detail pages (`/courses/{slug}`) are untouched; a query string on the old
      // URL is passed through (`/courses?category=20` keeps its category).
      { source: "/courses", destination: "/search?type=course", permanent: true },
      { source: "/diplomas", destination: "/search?type=diploma", permanent: true },
      { source: "/packages", destination: "/search?type=package", permanent: true },
      { source: "/consultations", destination: "/search?type=consultation", permanent: true },
    ];
  },
  async headers() {
    const headers = isIndexable()
      ? securityHeaders
      : // Staging / previews: also covers non-HTML responses (images, llms.txt) that meta robots can't.
        [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers },
      ...["/login", "/register", "/api/auth/:path*"].map((source) => ({ source, headers: noFraming })),
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 60 for decorative/background imagery (hero portrait grid), 75 is the default everywhere else.
    qualities: [60, 75],
    // A short ladder keeps srcset attributes (and the optimizer cache) small; cards never exceed ~600px.
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [160, 256, 384],
    remotePatterns: [
      ...s3Buckets,
      { protocol: "https", hostname: "live.emasteryacademy.com", pathname: "/uploads/**" },
      // Built assets of the live site, e.g. trainer cutouts for the live-training spotlight.
      { protocol: "https", hostname: "live.emasteryacademy.com", pathname: "/assets/**" },
      { protocol: "https", hostname: "public.emasteryacademy.com", pathname: "/**" },
      ...(bunnyCdnHostname ? [{ protocol: "https" as const, hostname: bunnyCdnHostname, pathname: "/**" }] : []),
    ],
  },
};

export default nextConfig;
