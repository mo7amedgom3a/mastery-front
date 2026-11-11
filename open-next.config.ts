// OpenNext adapter config for the Cloudflare Workers deployment (see wrangler.jsonc).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

export default defineCloudflareConfig({
  // Rendered pages and `fetch` / data-cache entries live in R2 (binding NEXT_INC_CACHE_R2_BUCKET),
  // fronted by the data center's Cache API: a home render reads ~25 entries, and R2 round trips
  // dominated its wall time. Tags are still checked on every hit, so revalidateTag stays immediate.
  // No background refresh on hits: it re-read and re-wrote the whole entry (a page's HTML + RSC,
  // ~1-2 MB) inside every request, ~250 ms CPU per hit. Writes already update this cache, and all
  // reads and writes happen in the one placement region (wrangler.jsonc "placement").
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: false,
  }),
  // `revalidateTag` (src/app/api/revalidate/route.ts, called by the admin after a publish) is
  // recorded in sharded Durable Objects (binding NEXT_TAG_CACHE_DO_SHARDED); without a tag cache it
  // would be a no-op. The DOs live next to the Worker's placement; shard answers are cached for 5 s
  // per data center, so an admin publish shows up within a few seconds.
  tagCache: doShardedTagCache({ baseShardSize: 12, regionalCache: true, regionalCacheTtlSec: 5 }),
  // Background revalidation is deduplicated by a Durable Object (binding NEXT_CACHE_DO_QUEUE).
  queue: doQueue,
});
