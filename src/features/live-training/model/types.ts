import type { BrandColor } from "@/components/ui/brand-colors";
import type { Pricing } from "@/lib/pricing";

/**
 * A live (streamed) training as the API returns it. There is no backend endpoint yet: this is the
 * contract `GET /api/live-trainings` serves from mock data (see `api/mock-data.ts`).
 */
export type LiveTrainingDto = {
  id: number;
  slug: string;
  title: string;
  /** English programme name, e.g. "Sales Mastery Professional". */
  title_en: string | null;
  subtitle: string | null;
  summary: string | null;
  /** Cohort label, e.g. "الدفعة 7". */
  cohort_label: string | null;
  /** 16:9 promo artwork (cards, social). */
  cover_image: string | null;
  /** Transparent portrait cutout of the lead trainer (spotlight banner). */
  hero_image: string | null;
  trainer: {
    name: string;
    title: string | null;
    image: string | null;
  };
  /** ISO 8601 with offset: first session start. */
  starts_at: string;
  /** ISO 8601 with offset: last session end. */
  ends_at: string;
  sessions_count: number;
  /** Daily session window, 24h "HH:mm" in `timezone`. */
  session_start: string;
  session_end: string;
  /** IANA zone the dates and session times are written in. */
  timezone: string;
  /** How the zone is named to learners, e.g. "بتوقيت مكة". */
  timezone_label: string;
  location: string;
  certificate: string | null;
  price: {
    usd: number;
    sar: number | null;
  };
  /** YouTube video id of the trailer. */
  intro_video_youtube_id: string | null;
  brochure_url: string | null;
  /** Where enrolment happens (the live site) until a detail page ships here. */
  enroll_url: string;
  highlights: string[];
};

export type LiveTrainingsResponse = {
  items: LiveTrainingDto[];
  total: number;
};

/** What the spotlight banner and the `/live` cards render. Mapped in `mappers.ts`. */
export type LiveTrainingVM = {
  id: number;
  title: string;
  titleEn: string | null;
  subtitle: string | null;
  summary: string | null;
  cohort: string | null;
  coverImage: string | null;
  heroImage: string | null;
  trainerName: string;
  trainerTitle: string | null;
  /** "5–10 أكتوبر 2026". */
  dateRange: string;
  /** "5 أيام تدريبية". */
  sessions: string;
  /** "7:30 م – 10:00 م (بتوقيت مكة)". */
  sessionTime: string;
  location: string;
  certificate: string | null;
  price: Pricing;
  priceSar: number | null;
  trailerEmbedUrl: string | null;
  brochureUrl: string | null;
  enrollUrl: string;
  highlights: string[];
  /** Solid field behind the trainer cutout. */
  color: BrandColor;
};
