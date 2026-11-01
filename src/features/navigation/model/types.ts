import type { Route } from "next";

import type { ProductType } from "@/features/search/model/params";

/** View models for the header's solutions menu; the API response is mapped in `mappers.ts`. */

export type MenuCategoryVM = {
  id: string;
  /** Search category code (`legacy-category-27`, `marketing/sales`). */
  slug: string;
  name: string;
  count: number;
};

export type MenuGroupVM = {
  type: ProductType;
  label: string;
  href: Route;
  count: number;
  categories: MenuCategoryVM[];
};

export type ExploreMenuVM = {
  groups: MenuGroupVM[];
};

/** One field across every product type, linking to all of its programs. */
export type SolutionsCategoryVM = {
  slug: string;
  name: string;
  href: Route;
  count: number;
};

export type SolutionsTypeVM = {
  type: ProductType;
  label: string;
  href: Route;
  /** Missing when the catalog could not be read. */
  count?: number;
};

export type SolutionsMenuVM = {
  /** Largest first. */
  categories: SolutionsCategoryVM[];
  types: SolutionsTypeVM[];
};
