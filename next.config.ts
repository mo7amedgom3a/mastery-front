import FaroSourceMapUploaderPlugin from "@grafana/faro-webpack-plugin";
import type { NextConfig } from "next";
import { isIndexable } from "./src/config/env";

// Grafana Faro source-map upload. App/stack ids come from the Faro app (see .env.example); the API
// key is a build-time secret, so uploads are skipped (not failed) when it is absent.
const faroAppName = process.env.NEXT_PUBLIC_FARO_APP_NAME?.trim() || "mastery-app";
const faroUploadEndpoint =
  process.env.FARO_API_ENDPOINT?.trim() || "https://faro-api-prod-us-west-0.grafana.net/faro/api/v1";
const faroAppId = process.env.FARO_APP_ID?.trim() || "5762";
const faroStackId = process.env.FARO_STACK_ID?.trim() || "1854221";
const faroApiKey = process.env.FARO_API_KEY?.trim();

// PostHog ingestion, proxied same-origin under /ingest (fewer events lost to ad-blockers, no
// third-party connection before the visitor interacts). EU projects use eu.i.posthog.com.
const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com").replace(/\/$/, "");
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

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
  // Emit browser source maps so the Faro webpack plugin below can upload them; it deletes the files
  // after upload, so they are never served to visitors.
  productionBrowserSourceMaps: true,
  // PostHog's API paths end in a slash (`/e/`, `/flags/`), so the built-in slash-stripping redirect
  // is turned off and re-added below for every path except /ingest: page URLs keep one canonical form.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/ingest/array/:path*", destination: `${posthogAssetsHost}/array/:path*` },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/:path((?!ingest(?:/|$)).+)/", destination: "/:path", permanent: true },
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
  // Only runs under `next build --webpack` (the build script): dev keeps Turbopack, whose plugin
  // API the Faro uploader does not implement. The plugin injects the bundle id into the client
  // bundles and uploads their source maps; with no API key it still injects and skips the upload.
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      config.plugins.push(
        new FaroSourceMapUploaderPlugin({
          appName: faroAppName,
          endpoint: faroUploadEndpoint,
          appId: faroAppId,
          stackId: faroStackId,
          apiKey: faroApiKey ?? "",
          nextjs: true,
          recursive: true,
          gzipContents: true,
          verbose: true,
          skipUpload: !faroApiKey,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
