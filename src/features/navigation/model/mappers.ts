import type { Route } from "next";

import type { ProductType } from "@/features/search/model/params";
import { routes } from "@/config/routes";
import type { CatalogMenuResponse } from "@/lib/api/catalog";

import type { ExploreMenuVM, MenuCategoryVM, MenuGroupVM, SolutionsCategoryVM, SolutionsMenuVM } from "./types";

type MenuGroupDto = NonNullable<CatalogMenuResponse["groups"]>[number];
type MenuCategoryDto = NonNullable<MenuGroupDto["categories"]>[number];

const GROUP_ORDER: readonly ProductType[] = ["course", "diploma", "package", "consultation"];

const GROUP_LABELS: Record<ProductType, string> = {
  course: "الدورات",
  diploma: "الدبلومات",
  package: "الباقات",
  consultation: "الاستشارات",
};

const GROUP_HREFS: Record<ProductType, Route> = {
  course: routes.courses,
  diploma: routes.diplomas,
  package: routes.packages,
  consultation: routes.consultations,
};

function isProductType(value: string): value is ProductType {
  return (GROUP_ORDER as readonly string[]).includes(value);
}

function mapCategory(dto: MenuCategoryDto): MenuCategoryVM {
  return {
    id: dto.category_id,
    slug: dto.slug,
    name: dto.name.trim(),
    count: dto.product_count,
  };
}

function mapGroup(dto: MenuGroupDto): MenuGroupVM | null {
  const type = dto.product_type;
  if (!isProductType(type) || dto.count <= 0) {
    return null;
  }
  return {
    type,
    label: GROUP_LABELS[type],
    href: GROUP_HREFS[type],
    count: dto.count,
    categories: (dto.categories ?? []).map(mapCategory),
  };
}

export function mapExploreMenu(response: CatalogMenuResponse): ExploreMenuVM {
  const groups = (response.groups ?? [])
    .map(mapGroup)
    .filter((group): group is MenuGroupVM => group !== null)
    .sort((a, b) => GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type));
  return { groups };
}

/**
 * The catalog by field and by product type. The same field appears under each product type, so it
 * is merged into one entry here. Without catalog data (a failed read) the product types still have
 * their listings.
 */
export function mapSolutionsMenu(groups: readonly MenuGroupVM[]): SolutionsMenuVM {
  const categories = new Map<string, SolutionsCategoryVM>();
  for (const group of groups) {
    for (const { slug, name, count } of group.categories) {
      const existing = categories.get(slug);
      categories.set(slug, {
        slug,
        name,
        href: routes.searchCategory(slug),
        count: (existing?.count ?? 0) + count,
      });
    }
  }
  return {
    categories: [...categories.values()].sort((a, b) => b.count - a.count),
    types:
      groups.length > 0
        ? groups.map(({ type, label, href, count }) => ({ type, label, href, count }))
        : GROUP_ORDER.map((type) => ({ type, label: GROUP_LABELS[type], href: GROUP_HREFS[type] })),
  };
}
