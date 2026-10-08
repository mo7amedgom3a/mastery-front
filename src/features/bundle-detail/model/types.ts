import type { Route } from "next";

import type { FilterVM } from "@/features/landing/model/types";
import type { InfoSectionVM, TrainerVM } from "@/features/product-detail/model/types";
import type { Pricing } from "@/lib/pricing";

import type { BundleSavings } from "../content/mock-pricing";

/** View models for bundles (حزم ماستري). Mapped from catalog DTOs in `mappers.ts`, never used raw. */

/** What a bundle member is; anything the storefront doesn't sell on its own is `other`. */
export type BundleMemberKind = "diploma" | "course" | "consultation" | "package" | "other";

/** "دبلوم واحد", "3 دورات": how many members of one kind the bundle holds. */
export type BundleCompositionVM = { kind: BundleMemberKind; count: number; label: string };

export type BundleCardVM = {
  /** Catalog slug. */
  id: string;
  title: string;
  summary: string | null;
  href: Route;
  composition: BundleCompositionVM[];
  price: Pricing;
  priceAmount: number | null;
  filterKeys: string[];
};

export type BundleLandingVM = { bundles: BundleCardVM[]; filters: FilterVM[] };

export type BundleUnitVM = { id: number; title: string; lessonCount: number; duration: string | null };

/** One product inside the bundle, enriched from its own legacy detail when that loaded. */
export type BundleMemberVM = {
  key: string;
  kind: BundleMemberKind;
  /** 1-based, in the bundle's own order. */
  position: number;
  title: string;
  summary: string | null;
  image: string | null;
  /** The member's own page; null when it has none on this site. */
  href: Route | null;
  category: string | null;
  /** Lead instructor or consultant names. */
  people: string[];
  /** Content length, or the session count and length for a consultation. */
  duration: string | null;
  lessonCount: number;
  /** Outline only (no lessons); empty when only the catalog summary was available. */
  units: BundleUnitVM[];
  price: Pricing;
};

export type BundleMemberGroupVM = { kind: BundleMemberKind; title: string; members: BundleMemberVM[] };

export type BundleDetailVM = {
  slug: string;
  productId: string;
  title: string;
  summary: string | null;
  /** Plain-text description for metadata. */
  description: string | null;
  sections: InfoSectionVM[];
  skills: string[];
  categories: string[];
  members: BundleMemberVM[];
  /** Members by kind, kinds in order of first appearance, members in the bundle's order. */
  groups: BundleMemberGroupVM[];
  composition: BundleCompositionVM[];
  /** Every member's trainers, once each. */
  trainers: TrainerVM[];
  /** "وصول لمدة عام"; null when the bundle sets no limit. */
  access: string | null;
  price: Pricing;
  priceAmount: number | null;
  savings: BundleSavings | null;
  /** Canonical URL path, e.g. `/bundles/ai-data-career-bundle`. */
  href: Route;
};
