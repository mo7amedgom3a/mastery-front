import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";

// Landing page only for now; add listing and detail routes as they ship (with their real
// updated-at dates as `lastModified`).
export default function sitemap(): MetadataRoute.Sitemap {
  const home = `${getSiteUrl()}/`;
  return [
    {
      url: home,
      // The landing page is rebuilt on every deploy and refreshed by ISR, so build time is honest.
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: { ar: home, "x-default": home } },
    },
  ];
}
