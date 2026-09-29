import type { NextConfig } from "next";
import { isIndexable } from "./src/config/env";

// Buckets the legacy backend serves product imagery from, plus the site's own upload host.
const s3Buckets = ["course", "curriculum", "consultant", "category", "instructor"].map((bucket) => ({
  protocol: "https" as const,
  hostname: "s3.eu-west-1.amazonaws.com",
  pathname: `/${bucket}.emasteryacademy.com/**`,
}));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    const headers = isIndexable()
      ? securityHeaders
      : // Staging / previews: also covers non-HTML responses (images, llms.txt) that meta robots can't.
        [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [{ source: "/:path*", headers }];
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
      { protocol: "https", hostname: "public.emasteryacademy.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
