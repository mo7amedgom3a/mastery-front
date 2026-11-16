"use client";

import { useQuery } from "@tanstack/react-query";

import { getAllCatalogCards, type CatalogCard } from "@/lib/api/browse";
import { catalogQueries } from "@/lib/api/catalog";

import { labQueries } from "../api";
import { rankCards } from "./recommendations";
import type { LabDefinition } from "./types";

const COURSES = 3;
const DIPLOMAS = 2;

export type LabRecommendations = {
  courses: CatalogCard[];
  diplomas: CatalogCard[];
  /** The lab's catalog category slug (`legacy-category-3`), for "see all" links. */
  categorySlug: string;
  pending: boolean;
  error: boolean;
};

/**
 * Courses and diplomas to recommend after (or before) a lab. The labs API owns the recommendation
 * set (and will return every product type later); the old catalog query remains the fallback when
 * the labs API is unreachable or has no configured recommendations.
 */
export function useLabRecommendations(lab: LabDefinition): LabRecommendations {
  const categorySlug = `legacy-category-${lab.categoryLegacyId}`;
  const recommendations = useQuery(labQueries.recommendations(lab.slug));
  const apiCourses = recommendations.data?.courses ?? [];
  const apiDiplomas = recommendations.data?.diplomas ?? [];
  const hasApiItems = apiCourses.length > 0 || apiDiplomas.length > 0;
  const needsFallback = !recommendations.isPending && (recommendations.isError || !hasApiItems);

  const categories = useQuery({ ...catalogQueries.categories(), enabled: needsFallback });
  const categoryId = categories.data?.find((category) => category.slug === categorySlug)?.category_id ?? null;
  const cards = useQuery({
    queryKey: ["labs", "recommendations", "catalog", categoryId],
    queryFn: ({ signal }) => getAllCatalogCards({ category_id: categoryId, product_type: ["course", "diploma"] }, { signal }),
    enabled: needsFallback && Boolean(categoryId),
    staleTime: 10 * 60_000,
  });

  const items = cards.data ?? [];
  const fallbackCourses = rankCards(
    items.filter((card) => card.product_type === "course"),
    lab.courseKeywords,
    COURSES,
    lab.featuredCourseSlugs,
  );
  const fallbackDiplomas = rankCards(
    items.filter((card) => card.product_type === "diploma"),
    lab.courseKeywords,
    DIPLOMAS,
  );

  return {
    courses: hasApiItems ? apiCourses.slice(0, COURSES) : fallbackCourses,
    diplomas: hasApiItems ? apiDiplomas.slice(0, DIPLOMAS) : fallbackDiplomas,
    categorySlug,
    pending: recommendations.isPending || (needsFallback && (categories.isPending || (Boolean(categoryId) && cards.isPending))),
    error: needsFallback && (categories.isError || cards.isError || (categories.isSuccess && !categoryId)),
  };
}
