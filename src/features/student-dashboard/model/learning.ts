import type { Route } from "next";

import type { OwnedProductResponse } from "@/lib/api/commerce";
import type { LmsCourse, LmsQuiz } from "@/lib/api/lms";
import type { ResolvedItem } from "@/lib/shop/contract";
import { studentProgramHref } from "@/lib/shop/product-links";
import { ownedProductTitle, productTypeLabel, safeImage } from "./products";

export type LearningStatus = "not_started" | "in_progress" | "completed" | "expired";

export type LearningProgram = {
  id: string;
  title: string;
  typeLabel: string;
  instructor: string | null;
  image: string | null;
  progress: number;
  status: LearningStatus;
  lastActivity: string | null;
  entitlementId: string | null;
  productSlug: string | null;
  lmsCourseId: number | null;
  /** Catalog type when the product is known; bundles and packages open their contents instead. */
  productType: string | null;
  /** The student page listing every resource inside a bundle/package; null for single courses. */
  detailsHref: Route | null;
};

export type QuizStats = {
  total: number;
  passed: number;
  failed: number;
  averageScore: number | null;
};

/** The LMS image bucket is allowed in next.config.ts; unknown hosts get no image. */
const LMS_IMAGE_HOSTS = new Set(["s3.eu-west-1.amazonaws.com", "live.emasteryacademy.com", "public.emasteryacademy.com"]);

export function safeLmsImage(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !LMS_IMAGE_HOSTS.has(parsed.hostname)) return null;
    if (parsed.hostname === "s3.eu-west-1.amazonaws.com") {
      return /^\/(course|curriculum|consultant|category|instructor|trainer|b2blogos)\.emasteryacademy\.com\//.test(parsed.pathname)
        ? url
        : null;
    }
    return url;
  } catch {
    return null;
  }
}

export function lmsProgram(course: LmsCourse): LearningProgram {
  return {
    id: `lms:${course.lms_course_id}`,
    title: course.title?.trim() || "برنامج من منصة التعلّم",
    typeLabel: course.course_type?.trim() || "دورة",
    instructor: course.trainer?.trim() || null,
    image: safeLmsImage(course.image_url),
    progress: course.progress_percent,
    status: course.status,
    lastActivity: course.last_activity_at ?? null,
    entitlementId: course.entitlement_id ?? null,
    productSlug: course.product_slug ?? null,
    lmsCourseId: course.lms_course_id,
    productType: null,
    detailsHref: null,
  };
}

export function ownedProgram(
  product: OwnedProductResponse,
  title: string,
  instructor?: string | null,
  image?: string | null,
): LearningProgram {
  return {
    id: `product:${product.product_id}`,
    title,
    typeLabel: productTypeLabel(product.product_type),
    instructor: instructor ?? null,
    image: safeImage(image) ?? null,
    progress: product.progress_pct ?? 0,
    status: product.progress_pct === 100 ? "completed" : product.progress_pct != null && product.progress_pct > 0 ? "in_progress" : "not_started",
    lastActivity: product.last_activity_at ?? null,
    entitlementId: product.entitlement_id ?? null,
    productSlug: product.slug,
    lmsCourseId: null,
    productType: product.product_type ?? null,
    detailsHref: studentProgramHref(product.product_type, product.slug),
  };
}

/**
 * Live LMS courses are the primary source. The owned-product snapshot is the real fallback when
 * the LMS call fails or returns no courses; mock data is never used.
 */
export function learningPrograms(
  lmsCourses: readonly LmsCourse[],
  owned: readonly OwnedProductResponse[],
  artwork: ReadonlyMap<string, ResolvedItem>,
): { items: LearningProgram[]; source: "lms" | "snapshot" } {
  if (lmsCourses.length > 0) {
    return {
      source: "lms",
      items: lmsCourses.map((course) => {
        const program = lmsProgram(course);
        // Some LMS courses have no cover of their own: borrow the catalog's for the same product.
        if (program.image) return program;
        const fallback = safeImage(course.product_slug ? artwork.get(course.product_slug)?.image : null);
        return fallback ? { ...program, image: fallback } : program;
      }),
    };
  }
  return {
    source: "snapshot",
    items: owned
      .filter((product) => product.product_type !== "consultation")
      .map((product) => {
        const item = artwork.get(product.slug);
        return ownedProgram(product, ownedProductTitle(product, item?.title), item?.instructor, item?.image ?? null);
      }),
  };
}

export function averageProgress(items: readonly LearningProgram[]): number | null {
  if (items.length === 0) return null;
  const values = items
    .filter((item) => item.status !== "expired")
    .map((item) => item.progress)
    .filter((value) => Number.isFinite(value));
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function quizStats(quizzes: readonly LmsQuiz[]): QuizStats {
  const passed = quizzes.filter((quiz) => quiz.passed === true).length;
  const failed = quizzes.filter((quiz) => quiz.passed === false).length;
  const scored = quizzes.filter((quiz) => quiz.score_percent !== null && quiz.score_percent !== undefined);
  return {
    total: quizzes.length,
    passed,
    failed,
    averageScore:
      scored.length > 0 ? Math.round(scored.reduce((sum, quiz) => sum + (quiz.score_percent ?? 0), 0) / scored.length) : null,
  };
}
