"use client";

import { useQuery } from "@tanstack/react-query";

import { getAllCatalogCards, type CatalogCard } from "@/lib/api/browse";
import { catalogQueries } from "@/lib/api/catalog";

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
 * Courses and diplomas to recommend after (or before) a lab: the lab's catalog category, with the
 * lab's featured courses pinned first, then ranked by the lab's keywords. Degrades to empty lists
 * when the API is unreachable.
 */
export function useLabRecommendations(lab: LabDefinition): LabRecommendations {
  const categorySlug = `legacy-category-${lab.categoryLegacyId}`;
  const categories = useQuery(catalogQueries.categories());
  const categoryId = categories.data?.find((category) => category.slug === categorySlug)?.category_id ?? null;
  const cards = useQuery({
    queryKey: ["labs", "recommendations", categoryId],
    queryFn: ({ signal }) => getAllCatalogCards({ category_id: categoryId, product_type: ["course", "diploma"] }, { signal }),
    enabled: Boolean(categoryId),
    staleTime: 10 * 60_000,
  });
  const items = cards.data ?? [];
  return {
    courses: rankCards(
      items.filter((card) => card.product_type === "course"),
      lab.courseKeywords,
      COURSES,
      lab.featuredCourseSlugs,
    ),
    diplomas: rankCards(
      items.filter((card) => card.product_type === "diploma"),
      lab.courseKeywords,
      DIPLOMAS,
    ),
    categorySlug,
    pending: categories.isPending || (Boolean(categoryId) && cards.isPending),
    error: categories.isError || cards.isError || (categories.isSuccess && !categoryId),
  };
}
