/*
 * B2B showcase API (`/api/v1/b2b/*`): the public business pages.
 *
 * The types are hand-written because the checked-in `openapi.json` predates the module; keep them in
 * sync with `newwebsitebackend/app/modules/b2b/presentation/schemas.py`. Every read is public and
 * unauthenticated; the admin surface under `/admin/b2b` is not used by the storefront.
 */
import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";

export type B2BStatSource = "static" | "programs" | "categories" | "companies" | "consultancies" | "lessons";
export type B2BStoryKind = "company_case" | "video_review" | "graduate_review" | "review";

export type B2BStat = {
  key: string;
  label: string;
  label_en: string | null;
  value: number;
  suffix: string | null;
  source: B2BStatSource;
};

export type B2BProgramCategory = {
  category_id: number;
  name: string;
  /** B2C catalog category code that mirrors the legacy id, e.g. `legacy-category-20`. */
  code: string;
};

export type B2BSubLibrary = { sub_library_id: number; name: string };

export type B2BProgram = {
  /** Opaque id: `course-<id>` for a program, `b2b-<id>` for a standalone B2B course. */
  program_id: string;
  kind: "program" | "course";
  title: string;
  slug: string | null;
  short_description: string | null;
  image_url: string | null;
  is_diploma: boolean;
  lesson_count: number;
  duration_seconds: number | null;
  category: B2BProgramCategory | null;
  sub_libraries: B2BSubLibrary[];
  updated_at: string | null;
};

export type B2BProgramPage = { items: B2BProgram[]; total: number; limit: number; offset: number };

export type B2BCategory = {
  category_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  program_count: number;
  code: string;
};

export type B2BConsultancy = {
  consultancy_id: number;
  name: string;
  summary: string | null;
  image_url: string | null;
  sessions: number | null;
  session_type: string | null;
  price_amount: number | null;
  currency: string;
};

export type B2BCustomProgram = {
  curriculum_id: number;
  name: string;
  summary: string | null;
  image_url: string | null;
  price_amount: number | null;
  currency: string;
};

export type B2BServices = { consultancies: B2BConsultancy[]; programs: B2BCustomProgram[] };

export type B2BCompany = {
  company_id: string;
  name: string;
  name_en: string | null;
  industry: string | null;
  country: string | null;
  logo_url: string | null;
  website_url: string | null;
  quote: string | null;
  is_featured: boolean;
};

export type B2BStoryCompany = { company_id: string; name: string; logo_url: string | null };

export type B2BStory = {
  story_id: string;
  kind: B2BStoryKind;
  title: string;
  summary: string | null;
  youtube_video_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  views_count: number | null;
  likes_count: number | null;
  company: B2BStoryCompany | null;
  course_title: string | null;
  published_at: string | null;
};

export type B2BStoryPage = { items: B2BStory[]; total: number; limit: number; offset: number };

export type B2BOverview = {
  /** False until the B2B catalog mirror tables exist on the API; catalog sections are then empty. */
  library_ready: boolean;
  /** False until the showcase migration has run on the API. */
  content_ready: boolean;
  stats: B2BStat[];
  categories: B2BCategory[];
  courses: B2BProgram[];
  companies: B2BCompany[];
  stories: B2BStory[];
  services: B2BServices;
};

export type B2BCourseParams = {
  kind?: "program" | "course";
  category_id?: number;
  sub_library_id?: number;
  is_diploma?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

export type B2BCompanyParams = { featured?: boolean; limit?: number; offset?: number };
export type B2BStoryParams = { kind?: B2BStoryKind; limit?: number; offset?: number };

export function getB2BOverview(options?: ApiRequestOptions): Promise<B2BOverview> {
  return apiRequest<B2BOverview>("GET", "/api/v1/b2b/overview", options);
}

export function getB2BCourses(
  params: B2BCourseParams = {},
  options?: ApiRequestOptions,
): Promise<B2BProgramPage> {
  return apiRequest<B2BProgramPage>("GET", "/api/v1/b2b/courses", { ...options, query: params });
}

export function getB2BCategories(options?: ApiRequestOptions): Promise<{ items: B2BCategory[] }> {
  return apiRequest<{ items: B2BCategory[] }>("GET", "/api/v1/b2b/categories", options);
}

export function getB2BCompanies(
  params: B2BCompanyParams = {},
  options?: ApiRequestOptions,
): Promise<{ items: B2BCompany[]; total: number }> {
  return apiRequest<{ items: B2BCompany[]; total: number }>("GET", "/api/v1/b2b/companies", {
    ...options,
    query: params,
  });
}

export function getB2BServices(
  params: { limit?: number } = {},
  options?: ApiRequestOptions,
): Promise<B2BServices> {
  return apiRequest<B2BServices>("GET", "/api/v1/b2b/services", { ...options, query: params });
}

export function getB2BStories(
  params: B2BStoryParams = {},
  options?: ApiRequestOptions,
): Promise<B2BStoryPage> {
  return apiRequest<B2BStoryPage>("GET", "/api/v1/b2b/stories", { ...options, query: params });
}
