import type { Route } from "next";

import type { B2BStoryKind } from "@/lib/api/b2b";
import { formatClock, formatDurationFromSeconds, formatNumber, formatPrice } from "@/lib/format";

/** Display models for the business pages. Kept free of API imports so any component can use them. */

export type StatVM = { key: string; label: string; value: number; suffix: string };

export type FieldVM = { code: string; name: string; count: number; href: Route };

export type CompanyVM = {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  industry: string | null;
};

export type StoryVM = {
  id: string;
  kind: B2BStoryKind;
  kindLabel: string;
  title: string;
  /** YouTube id, when the story is a video (drives the embed). */
  youtubeId: string | null;
  videoUrl: string | null;
  thumbnail: string | null;
  duration: string | null;
  course: string | null;
  views: number | null;
};

export type LandingVM = {
  /** False when the API is unreachable or does not expose the module yet; pages then use curated fallbacks. */
  hasApiData: boolean;
  libraryReady: boolean;
  contentReady: boolean;
  stats: StatVM[];
  fields: FieldVM[];
  companies: CompanyVM[];
  stories: StoryVM[];
  totals: { programs: number; courses: number; lessons: number };
};

export const STORY_KIND_LABELS: Record<B2BStoryKind, string> = {
  company_case: "قصة شركة",
  video_review: "مراجعة برنامج",
  graduate_review: "رأي خريج",
  review: "رأي",
};

/** Numbers on the marketing pages are Latin digits, grouped the Arabic way (matching the rest of the site). */
export function statValue(value: number): string {
  return formatNumber(value);
}

export { formatClock, formatDurationFromSeconds, formatNumber, formatPrice };
