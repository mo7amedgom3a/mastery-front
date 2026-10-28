import type { Route } from "next";

import type { ProductType } from "@/features/search/model/params";

/** View models for the header's explore menu; the API cards are mapped in `mappers.ts`. */

export type MenuProductVM = {
  key: string;
  title: string;
  href: Route;
  image: string | null;
  /** Formatted current price, or "مجاني" for a free product. */
  price: string;
  /** Formatted pre-offer price, only while an offer undercuts it. */
  originalPrice: string | null;
};

export type MenuCategoryVM = {
  id: string;
  /** Search category code (`legacy-category-27`, `marketing/sales`). */
  slug: string;
  name: string;
  href: Route;
  count: number;
  products: MenuProductVM[];
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
