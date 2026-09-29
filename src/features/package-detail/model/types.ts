import type { Route } from "next";

import type { InfoSectionVM, ProductKind, RailCardVM, TrainerVM } from "@/features/product-detail/model/types";
import type { Pricing } from "@/lib/pricing";

/** View models for the package page. Mapped from API DTOs in `mappers.ts`, never used raw. */

export type PackageUnitVM = {
  id: number;
  title: string;
  lessonCount: number;
  duration: string | null;
};

/** One course or diploma inside the package; links to its own detail page when it has one. */
export type PackageItemVM = {
  key: string;
  kind: ProductKind;
  id: number;
  /** 1-based, in the package's own order. */
  position: number;
  title: string;
  summary: string | null;
  image: string | null;
  /** Null for a course retired from the catalog: it has no page of its own. */
  href: Route | null;
  category: string | null;
  duration: string | null;
  lessonCount: number;
  trainers: { id: number; name: string; href: Route }[];
  /** Outline only (no lessons); empty when only the catalog card was available. */
  units: PackageUnitVM[];
  price: Pricing;
  priceAmount: number | null;
};

export type PackageSavingsVM = {
  /** The included items' prices added up, formatted. */
  separateTotal: string;
  /** How much less the package costs, formatted. */
  amount: string;
  percent: number;
};

export type PackageDetailVM = {
  id: number;
  title: string;
  summary: string | null;
  /** Longer plain-text description for metadata. */
  description: string | null;
  image: string | null;
  price: Pricing;
  priceAmount: number | null;
  /** Set only when every included item has a price and together they cost more than the package. */
  savings: PackageSavingsVM | null;
  courseCount: number;
  diplomaCount: number;
  /** Sum of the items' content length, formatted. */
  duration: string | null;
  lessonCount: number;
  sections: InfoSectionVM[];
  items: PackageItemVM[];
  /** Every item's trainers, once each, in order of first appearance. */
  trainers: TrainerVM[];
  /** Canonical URL path, e.g. `/packages/1`. */
  href: Route;
  indexable: boolean;
};

export type PackageDetailData = {
  product: PackageDetailVM;
  related: RailCardVM[];
  recommended: RailCardVM[];
};
