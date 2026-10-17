import "server-only";

import { getBunnyConfig } from "@/config/env";

import type { IntroVideoSource, IntroVideoVM } from "../model/types";

const REVALIDATE_SECONDS = 300;

/**
 * The intro video as a Bunny iframe, or null when it can't play: no library configured, or the video isn't
 * in the library. Bunny's embed page answers 200 even for a missing video (it renders its own "404"), so
 * existence is checked on the library's CDN instead, where the playlist is a clean 200/404. Visitors never
 * see a broken or "not found" player; the section is simply left out. `fresh` skips the cache (Studio preview).
 */
export async function verifyIntroVideo(source: IntroVideoSource | null, fresh = false): Promise<IntroVideoVM | null> {
  const bunny = getBunnyConfig();
  if (!source || !bunny) {
    return null;
  }
  const base = `https://${bunny.cdnHostname}/${source.videoId}`;
  if (!(await isReachable(`${base}/playlist.m3u8`, fresh))) {
    return null;
  }
  return {
    embedUrl: `https://player.mediadelivery.net/embed/${bunny.libraryId}/${source.videoId}`,
    poster: `${base}/thumbnail.jpg`,
    title: source.title,
    duration: source.duration,
  };
}

/** Whether the URL answers 2xx. A slow CDN counts as unreachable rather than holding the page render. */
async function isReachable(url: string, fresh: boolean): Promise<boolean> {
  try {
    const response = await fetch(url, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: REVALIDATE_SECONDS } }),
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
