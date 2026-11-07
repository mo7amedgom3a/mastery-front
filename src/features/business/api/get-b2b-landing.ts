import "server-only";

import { cache } from "react";

import { businessFieldFallback } from "@/features/business/content/b2b";
import { b2bFallbackStats } from "@/features/business/content/b2b-landing";
import { emptySearchState, searchHref } from "@/features/search/model/params";
import type { B2BCategory, B2BOverview, B2BStory } from "@/lib/api/b2b";
import { getB2BCategories, getB2BOverview, getB2BStories } from "@/lib/api/b2b";
import { cachedRead } from "@/lib/api/server-cache";
import { formatClock } from "@/lib/format";

import {
  STORY_KIND_LABELS,
  type CompanyVM,
  type FieldVM,
  type LandingVM,
  type StatVM,
  type StoryVM,
} from "../model/b2b-view";

/** Storefront cache tag for the B2B reads (`POST /api/revalidate?tag=b2b`). */
export const B2B_CACHE_TAG = "b2b";
const read = cachedRead(600, [B2B_CACHE_TAG]);

/**
 * `learners` is intentionally not shown: the API reports employees assigned to company departments
 * (a smaller number than the "15,000+ trained" marketing line in the footer). Showing both on the
 * same site would contradict itself until the copy is reconciled.
 */
const HIDDEN_STAT_KEYS = new Set(["learners"]);
const MAX_STATS = 6;

function toStats(overview: B2BOverview | null): StatVM[] {
  if (!overview || overview.stats.length === 0) return b2bFallbackStats;
  return overview.stats
    .filter((stat) => !HIDDEN_STAT_KEYS.has(stat.key))
    .slice(0, MAX_STATS)
    .map((stat) => ({ key: stat.key, label: stat.label, value: stat.value, suffix: stat.suffix ?? "" }));
}

/**
 * Rows created in the local mirror for tests reuse the backend's local id floor
 * (`LEGACY_LOCAL_ID_FLOOR`); they must never reach the marketing page.
 */
const LOCAL_TEST_ID_FLOOR = 900_000_000;

function toFields(categories: B2BCategory[]): FieldVM[] {
  if (categories.length > 0) {
    return categories
      .filter((category) => category.program_count > 0)
      .map((category) => ({
        code: category.code,
        name: category.name.trim(),
        count: category.program_count,
        href: searchHref({ ...emptySearchState, categories: [category.code] }),
      }));
  }
  // The API is down (or the mirror is empty): keep the page useful with the known fields, no counts.
  return businessFieldFallback.map((field) => ({
    code: field.category,
    name: field.title,
    count: 0,
    href: searchHref({ ...emptySearchState, categories: [field.category] }),
  }));
}

function toStory(story: B2BStory): StoryVM {
  const thumbnail =
    story.thumbnail_url ??
    (story.youtube_video_id ? `https://img.youtube.com/vi/${story.youtube_video_id}/hqdefault.jpg` : null);
  return {
    id: story.story_id,
    kind: story.kind,
    kindLabel: STORY_KIND_LABELS[story.kind] ?? "قصة",
    title: story.title,
    youtubeId: story.youtube_video_id,
    videoUrl:
      story.video_url ?? (story.youtube_video_id ? `https://www.youtube.com/watch?v=${story.youtube_video_id}` : null),
    thumbnail,
    duration: formatClock(story.duration_seconds),
    course: story.course_title,
    views: story.views_count,
  };
}

function toCompanies(overview: B2BOverview | null): CompanyVM[] {
  return (overview?.companies ?? [])
    .filter((company) => Boolean(company.logo_url))
    .map((company) => ({
      id: company.company_id,
      name: company.name.trim(),
      logo: company.logo_url as string,
      website: company.website_url,
      industry: company.industry,
    }));
}

function toTotals(overview: B2BOverview | null): LandingVM["totals"] {
  const value = (key: string) => overview?.stats.find((stat) => stat.key === key)?.value ?? 0;
  return { programs: value("programs"), courses: value("courses"), lessons: value("lessons") };
}

/**
 * The B2B landing view model: one cached API read mapped to display data.
 *
 * Fails soft: when the API is unreachable (or does not expose the module yet) the page still renders
 * with the verified fallback numbers and the curated fields, and hides the data-only sections.
 */
export const getB2bLanding = cache(async (): Promise<LandingVM> => {
  // The overview carries a trimmed catalogue (6 categories, 6 programs); the fields section needs all.
  const [overviewResult, categoriesResult, storiesResult] = await Promise.allSettled([
    getB2BOverview(read),
    getB2BCategories(read),
    getB2BStories({ limit: 6 }, read),
  ]);
  const overview = overviewResult.status === "fulfilled" ? overviewResult.value : null;
  if (overview === null) {
    console.error("[api] b2b overview request failed", overviewResult.status === "rejected" ? overviewResult.reason : null);
  }
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value.items : (overview?.categories ?? []);
  const stories =
    storiesResult.status === "fulfilled" ? storiesResult.value.items : (overview?.stories ?? []);

  return {
    hasApiData: overview !== null,
    libraryReady: overview?.library_ready ?? false,
    contentReady: overview?.content_ready ?? false,
    stats: toStats(overview),
    fields: toFields(categories),
    companies: toCompanies(overview),
    stories: stories.map(toStory),
    totals: toTotals(overview),
  };
});
