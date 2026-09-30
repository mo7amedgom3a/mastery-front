import type { Route } from "next";

import type { BrandColor } from "@/components/ui/brand-colors";
import type { RailCardVM } from "@/features/product-detail/model/types";
import type { TextBlock } from "@/lib/format";

/** View models for the expert profile page. Mapped from API DTOs in `mappers.ts`, never used raw. */

export type SocialKind = "facebook" | "instagram" | "youtube";
export type SocialLinkVM = { kind: SocialKind; href: string };

export type ExpertCountsVM = {
  courses: number;
  diplomas: number;
  packages: number;
  consultations: number;
};

export type ExpertVM = {
  /** Trainer id, or `c{id}` for an expert who only gives consultations. */
  key: string;
  name: string;
  /** First letter, for the avatar fallback when there is no photo. */
  initial: string;
  avatar: string | null;
  /** Cover image when the catalog has one; the page falls back to a field of `color`. */
  cover: string | null;
  /** Brand colour of the cover field, stable per expert. */
  color: BrandColor;
  bio: TextBlock[];
  /** Short plain-text bio for metadata and structured data. */
  summary: string | null;
  /** Their own specialty line when filled in, otherwise the categories they work in. */
  specialties: string[];
  socials: SocialLinkVM[];
  /** What is actually shown on the page (published items only). */
  counts: ExpertCountsVM;
  /** Points lifted by the API from the expert's own services. */
  whatTheyDo: string[];
  whoTheyHelp: string[];
  /** Canonical URL path, e.g. `/experts/9-د._مظهر_قنطقجي`. */
  href: Route;
  /** False when the profile has nothing to offer: kept out of search engines. */
  indexable: boolean;
};

export type ExpertDetailData = {
  expert: ExpertVM;
  consultations: RailCardVM[];
  courses: RailCardVM[];
  diplomas: RailCardVM[];
  packages: RailCardVM[];
  /** Other experts' courses, diplomas and packages in the same categories. */
  relatedPrograms: RailCardVM[];
  /** Other experts' consultations in the same categories. */
  relatedConsultations: RailCardVM[];
  recommended: RailCardVM[];
};
